-- RPG Tracker — первоначальная схема и ограничения доступа.
-- ВАЖНО: сначала сохранить резервную копию и проверить существующую таблицу characters.
-- Скрипт пересоздаёт RLS-политики на таблицах приложения, но не удаляет персонажей.

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  max_hp integer not null default 20,
  current_hp integer not null default 20,
  armor integer not null default 0,
  image_url text,
  image_path text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Добавляем отсутствующие поля, если таблица уже существовала.
alter table public.characters add column if not exists image_path text;
alter table public.characters add column if not exists updated_at timestamptz not null default now();
create index if not exists characters_user_idx on public.characters(user_id);
create index if not exists characters_status_idx on public.characters(status);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.character_cards (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  type text not null check (type in ('attack', 'defense', 'healing')),
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists cards_character_idx on public.character_cards(character_id);

create table if not exists public.character_actions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  action_type text not null,
  amount integer not null default 0,
  blocked_amount integer not null default 0,
  hp_before integer not null,
  hp_after integer not null,
  armor_before integer not null,
  armor_after integer not null,
  note text not null default '',
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists actions_character_created_idx
  on public.character_actions(character_id, created_at desc);

-- Приводим существующих персонажей к корректному формату, не меняя их владельцев.
update public.characters set updated_at = now() where updated_at is null;
-- Не исправляем молча некорректные max_hp/armor: сначала проверьте существующие данные.

alter table public.characters enable row level security;
alter table public.admins enable row level security;
alter table public.character_cards enable row level security;
alter table public.character_actions enable row level security;

-- Удаляем старые политики приложения, чтобы старое разрешение UPDATE не
-- позволяло игрокам самостоятельно менять HP или одобрять свои анкеты.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('characters', 'admins', 'character_cards', 'character_actions')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- У анонимных пользователей доступ только к одобренным персонажам.
create policy characters_read on public.characters
  for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or public.is_admin());

-- Каждый игрок может создать только собственную заявку на модерации.
create policy characters_apply on public.characters
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and char_length(trim(name)) between 1 and 100
    and max_hp between 1 and 100000
    and current_hp = max_hp
    and armor = 0
  );

create policy characters_admin_update on public.characters
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy characters_admin_delete on public.characters
  for delete to authenticated using (public.is_admin());

create policy admins_read_self on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy cards_read on public.character_cards
  for select to anon, authenticated
  using (exists (
    select 1 from public.characters c
    where c.id = character_id
      and (c.status = 'approved' or c.user_id = (select auth.uid()) or public.is_admin())
  ));
create policy cards_admin_insert on public.character_cards
  for insert to authenticated with check (public.is_admin());
create policy cards_admin_update on public.character_cards
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cards_admin_delete on public.character_cards
  for delete to authenticated using (public.is_admin());

create policy actions_read on public.character_actions
  for select to anon, authenticated
  using (exists (
    select 1 from public.characters c
    where c.id = character_id
      and (c.status = 'approved' or c.user_id = (select auth.uid()) or public.is_admin())
  ));
-- Нет политик вставки/редактирования истории: записи создаёт только серверная функция.

-- Привилегии SQL поверх RLS: без доступа к таблице политика сама по себе не сработает.
grant select on public.characters, public.character_cards, public.character_actions to anon, authenticated;
grant insert, update, delete on public.characters, public.character_cards to authenticated;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
revoke all on public.character_actions from anon, authenticated;
grant select on public.character_actions to anon, authenticated;

-- Атомарное применение урона, лечения и брони.
create or replace function public.apply_character_action(
  p_character_id uuid,
  p_action text,
  p_amount integer,
  p_note text default ''
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  c public.characters%rowtype;
  v_hp integer;
  v_armor integer;
  v_blocked integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Недостаточно прав';
  end if;
  if p_action not in ('damage', 'heal', 'set_armor')
     or p_amount is null or p_amount < 0 or p_amount > 100000
     or (p_action in ('damage', 'heal') and p_amount = 0) then
    raise exception 'Некорректное действие или количество';
  end if;
  if char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Комментарий слишком длинный';
  end if;

  select * into c from public.characters
    where id = p_character_id for update;
  if not found then raise exception 'Персонаж не найден'; end if;
  if c.status <> 'approved' then
    raise exception 'Изменять характеристики можно только у одобренного персонажа';
  end if;

  v_hp := c.current_hp;
  v_armor := c.armor;
  if p_action = 'damage' then
    v_blocked := least(c.armor, p_amount);
    v_armor := c.armor - v_blocked;
    v_hp := greatest(0, c.current_hp - (p_amount - v_blocked));
  elsif p_action = 'heal' then
    v_hp := least(c.max_hp, c.current_hp + p_amount);
  elsif p_action = 'set_armor' then
    v_armor := p_amount;
  end if;

  update public.characters
    set current_hp = v_hp, armor = v_armor, updated_at = now()
    where id = c.id;

  insert into public.character_actions (
    character_id, action_type, amount, blocked_amount,
    hp_before, hp_after, armor_before, armor_after, note, performed_by
  ) values (
    c.id, p_action, p_amount, v_blocked,
    c.current_hp, v_hp, c.armor, v_armor, coalesce(p_note, ''), auth.uid()
  );
end;
$$;
revoke all on function public.apply_character_action(uuid,text,integer,text) from public;
grant execute on function public.apply_character_action(uuid,text,integer,text) to authenticated;

-- Одобрение, отклонение, архивация и восстановление персонажа.
create or replace function public.moderate_character(
  p_character_id uuid,
  p_status text,
  p_note text default ''
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare c public.characters%rowtype;
begin
  if not public.is_admin() then raise exception 'Недостаточно прав'; end if;
  if p_status not in ('approved', 'rejected', 'archived') then
    raise exception 'Недопустимый статус';
  end if;
  if char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Комментарий слишком длинный';
  end if;
  select * into c from public.characters
    where id = p_character_id for update;
  if not found then raise exception 'Персонаж не найден'; end if;
  if c.status = p_status then raise exception 'Статус не изменился'; end if;

  update public.characters
    set status = p_status, updated_at = now()
    where id = p_character_id;
  insert into public.character_actions (
    character_id, action_type, amount, blocked_amount,
    hp_before, hp_after, armor_before, armor_after, note, performed_by
  ) values (
    c.id, 'status_' || p_status, 0, 0,
    c.current_hp, c.current_hp, c.armor, c.armor, coalesce(p_note, ''), auth.uid()
  );
end;
$$;
revoke all on function public.moderate_character(uuid,text,text) from public;
grant execute on function public.moderate_character(uuid,text,text) to authenticated;

-- Публичная галерея персонажей: прямые ссылки на изображения общедоступны.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('character-images', 'character-images', true, 3145728,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Удаляем только собственные именованные политики; другие политики Storage нужно
-- проверить вручную в Supabase Dashboard (они могут расширять доступ).
drop policy if exists rpg_character_upload on storage.objects;
drop policy if exists rpg_character_read on storage.objects;
drop policy if exists rpg_character_delete on storage.objects;
create policy rpg_character_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'character-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy rpg_character_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'character-images');
create policy rpg_character_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'character-images'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

-- Включаем изменения в Realtime, не добавляя повторно уже включённые таблицы.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['characters','character_cards','character_actions'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

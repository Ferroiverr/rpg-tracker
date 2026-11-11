-- Только чтение: помогает выяснить, совпадает ли старая таблица с новым кодом.
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('characters', 'admins', 'character_cards', 'character_actions')
order by table_name;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'characters'
order by ordinal_position;

select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('characters', 'admins', 'character_cards', 'character_actions')
order by tablename, policyname;

select name, id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'character-images';

-- ШАГ: сначала зарегистрируйте пользователя на сайте и подтвердите почту.
-- Затем ЗАМЕНИТЕ адрес ниже на email настоящего администратора.
-- Выполняется только в Supabase SQL Editor от имени владельца проекта.
insert into public.admins (user_id)
select id from auth.users
where lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL@example.com')
on conflict (user_id) do nothing;

-- Убедитесь, что здесь выводится нужный администратор:
select u.email, u.id
from public.admins a
join auth.users u on u.id = a.user_id;

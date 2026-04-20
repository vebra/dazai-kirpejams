-- ============================================
-- Auto-create user_profiles row on auth.users insert
-- ============================================
--
-- Problema: jei `user_profiles` row neegzistuoja, `get_my_verification_status()`
-- grąžina null → kainos niekada nerodomos, net ir teoriškai patvirtintam vartotojui.
--
-- Sprendimas: trigger'is, kuris automatiškai sukuria `user_profiles` row su
-- `verification_status='pending'` kiekvienam naujam auth.users įrašui.
-- Backfill query padengia esamus vartotojus, kuriems trūksta profilio.

-- ============================================
-- Trigger function
-- ============================================
create or replace function handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, verification_status)
  values (new.id, 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================
-- Trigger on auth.users
-- ============================================
drop trigger if exists trg_handle_new_user_profile on auth.users;
create trigger trg_handle_new_user_profile
  after insert on auth.users
  for each row execute function handle_new_user_profile();

-- ============================================
-- Backfill esamiems vartotojams
-- ============================================
-- Sukuriame trūkstamus user_profiles įrašus visiems esamiems auth.users.
insert into public.user_profiles (id, verification_status)
select u.id, 'pending'::verification_status
from auth.users u
left join public.user_profiles p on p.id = u.id
where p.id is null;

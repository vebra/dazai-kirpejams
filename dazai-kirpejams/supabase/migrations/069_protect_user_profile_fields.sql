-- ============================================
-- 069: user_profiles — apsaugoti jautrius laukus nuo savęs patvirtinimo
-- ============================================
-- KRITINĖ spraga: "Users update own profile" politika (010) yra
--   for update using (id = auth.uid())
-- BE `with check` ir be laukų apribojimo. Postgres'e USING-only UPDATE
-- politika riboja TIK kurias eilutes gali keisti, bet NEtikrina rezultato —
-- tad savininkas gali nustatyti BET KOKĮ stulpelį. Registracija atvira, todėl
-- bet kuris prisiregistravęs galėjo per PostgREST:
--   PATCH /rest/v1/user_profiles?id=eq.<savo> { "verification_status":"approved" }
-- → pats sau atrakinti kainas (get_product_prices gating'as = approved) ir net
--   { "role":"sales_rep" } → tapti vadybininke (create_rep_order pasitiki role).
-- (Admin nepasiekiamas — is_admin() remiasi atskira admin_users lentele.)
--
-- Sprendimas: BEFORE UPDATE trigeris, kuris eiliniam vartotojui (ne admin,
-- ne service_role) priverstinai grąžina jautrius laukus į OLD reikšmes.
-- Admin verifikaciją tvirtina per service_role klientą (createServerClient) —
-- jam (ir is_admin() sesijai) leidžiam viską. App eilinio vartotojo profilio
-- atnaujinimas keičia tik vardą/telefoną/kalbą, tad teisėtas srautas nenukenčia.
-- Tas pats principas kaip enforce_client_admin_fields (044).
--
-- ⚠️ Taikyti per Dashboard SQL Editor. Po to BŪTINA pasitikrinti su eiline
--    paskyra, kad verification_status lieka 'pending'.
-- ============================================

create or replace function enforce_user_profile_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Privilegijuoti kontekstai: admin (per service_role raktą auth.role()
  -- ='service_role', arba prisijungęs adminas is_admin()) — leidžiam viską.
  if auth.role() = 'service_role' or is_admin() then
    return new;
  end if;

  -- Eilinis vartotojas negali keisti jautrių laukų — grąžinam senas reikšmes.
  new.verification_status := old.verification_status;
  new.role := old.role;
  new.verified_at := old.verified_at;
  new.verified_by := old.verified_by;
  new.rejection_reason := old.rejection_reason;
  return new;
end;
$$;

drop trigger if exists trg_enforce_user_profile_protected on user_profiles;
create trigger trg_enforce_user_profile_protected
  before update on user_profiles
  for each row execute function enforce_user_profile_protected_fields();

notify pgrst, 'reload schema';

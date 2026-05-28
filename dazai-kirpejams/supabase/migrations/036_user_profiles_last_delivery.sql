-- ============================================
-- 036: user_profiles.last_delivery_data — paskutinio užsakymo
-- pristatymo pasirinkimas (pre-fill kitam checkout'ui)
-- ============================================
--
-- KODĖL: nuolatinis klientas (kirpykla, kuri kassyk perka tas pačias dažus)
-- kiekvieną sykį iš naujo įveda tą patį paštomato adresą ar kurjerio
-- adresą. Po sėkmingo užsakymo įrašom pasirinkimą; kitą sykį checkout'as
-- pre-fill'ina tas pačias reikšmes.
--
-- TAIKOMA: Supabase Dashboard SQL Editor, projektas bylzloadhsodqkhziime.
--
-- FORMATAS: JSONB su laukais:
--   {
--     "method": "courier" | "parcel_locker" | "pickup",
--     "address": "Gatvė 12",
--     "city": "Vilnius",
--     "postalCode": "LT-01000",
--     "parcelLocker": "LP Express, Vilniaus 5"
--   }
-- Laukai pagal method pasirinkimą — kai kurie gali būti null.

alter table public.user_profiles
  add column if not exists last_delivery_data jsonb;

comment on column public.user_profiles.last_delivery_data is $$Paskutinio sėkmingo užsakymo pristatymo pasirinkimas. JSONB su laukais method/address/city/postalCode/parcelLocker. Klientas niekur tiesiogiai šito nemato — naudojama pre-fill'inti CheckoutForm.$$;

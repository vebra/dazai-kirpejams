-- ============================================
-- 033: user_profiles.lang stulpelis
-- ============================================
--
-- KODĖL: kol kas vartotojo kalba (LT/EN/RU) nelaikoma nė vienoje vietoje.
-- Verifikacijos srautas (welcome + rejection) admin'o paleidžiamas dienomis
-- po registracijos — be saugomos kalbos visi gauna lietuviškus laiškus,
-- nors registravosi per /en/ ar /ru/.
--
-- KAIP TAIKOMA: Supabase Dashboard SQL Editor, projekto `bylzloadhsodqkhziime`.
-- Tada paleisti `notify pgrst, 'reload schema';` jei kviestumėte per REST
-- (čia stulpelis matosi per SELECT iškart — schema cache neblokuoja
-- standartinių lentelės užklausų, tik RPC funkcijas).
--
-- ATGALINIS SUDERINAMUMAS: senų eilučių lang = 'lt' (default). Nauji
-- registracijos srautai įrašys realią kalbą. Google OAuth vartotojai
-- (trigger'is 018) toliau gaus 'lt' default'ą, kol nebus pridėtos OAuth
-- locale propagacijos (atskira užduotis).

alter table public.user_profiles
  add column if not exists lang text not null default 'lt';

alter table public.user_profiles
  drop constraint if exists user_profiles_lang_check;

alter table public.user_profiles
  add constraint user_profiles_lang_check
  check (lang in ('lt', 'en', 'ru'));

comment on column public.user_profiles.lang is
  'Vartotojo registracijos kalba (lt/en/ru). Naudojama verifikacijos
   srauto el. laiškų lokalizacijai. OAuth vartotojai default lt.';

-- ============================================
-- 025: Papildomi user_profiles laukai + išplėstas business_type sąrašas
-- ============================================
--
-- Registracijos forma renka daugiau verifikacijai naudingos info:
--   1) miestas (city) — segmentavimui ir pristatymo planavimui
--   2) kasdienių dažymų skaičius (daily_dyes_count) — verslo dydžio rodiklis,
--      padeda admin'ui greičiau verifikuoti ir segmentavimui
--   3) išplėstas business_type — buvo tik hairdresser/salon/other; dabar
--      pridedam colorist (koloristas) ir student (besimokantis) kaip atskirus
--      role'us, kad admin matytų aiškiau
--
-- Saugome tekstu, ne enum — keičiant role pavadinimus nereikia DB migration'ų.
-- daily_dyes_count laikom tekstu (bucket'as: '1-3', '4-7', '8-15', '16+'),
-- nes tikslus skaičius nereikalingas, o bucket'ai gražiau atrodo admin UI.

alter table user_profiles
  add column if not exists city text,
  add column if not exists daily_dyes_count text;

-- Išplečiam check constraint'ą — drop'iname seną, kuriame naujas su
-- visais role'ais.
alter table user_profiles
  drop constraint if exists user_profiles_business_type_check;

alter table user_profiles
  add constraint user_profiles_business_type_check
  check (
    business_type is null
    or business_type in (
      'hairdresser',
      'colorist',
      'salon_owner',
      'salon',  -- legacy; nauji registrantai naudoja salon_owner
      'student',
      'other'
    )
  );

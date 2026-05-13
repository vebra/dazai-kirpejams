-- ============================================
-- Migracija 029 — renginio hero nuotrauka
-- ============================================
--
-- Prideda `hero_image_url` stulpelį prie `events` lentelės. Admin'as gali
-- įkelti naują nuotrauką per /admin/renginiai/redaguoti formą. Failo
-- saugykla — atskiras `events` Storage bucket'as (žr. migraciją 030).
--
-- Public puslapis /renginys naudoja šią reikšmę su fallback į
-- `/event-hero.jpg` (paskutinis hardcoded'intas hero, lieka public/ kaip
-- numatytasis vaizdas, jei admin'as dar neįkėlė savojo).

alter table events
  add column if not exists hero_image_url text;

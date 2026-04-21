-- ============================================
-- 022: Color SHOCK — numeracija prieš prekės ženklą
-- ============================================
--
-- Prekybinė taisyklė: koloristams atspalvio kodas (pvz. 12.12) yra
-- svarbiausias atpažinimo elementas — jis turi būti pavadinimo pradžioje,
-- kad būtų matomas kortelių sąrašuose, filtruose ir krepšelyje be skaitymo
-- per visą eilutę.
--
-- Buvo:    "Color SHOCK 12.12 — Ypač šviesinanti perlinė blondinė"
-- Dabar:   "12.12 Color SHOCK — Ypač šviesinanti perlinė blondinė"
--
-- Toneriai be numerio ("Color SHOCK Pelenų korektorius" ir pan.) nekeičiami —
-- jų regex pattern nepagauna, nes jie neturi "X.Y" decimalinio kodo.

UPDATE products
SET
  name_lt = regexp_replace(
    name_lt,
    '^Color SHOCK ([0-9]+\.[0-9]+)(.*)$',
    '\1 Color SHOCK\2'
  ),
  name_en = regexp_replace(
    name_en,
    '^Color SHOCK ([0-9]+\.[0-9]+)(.*)$',
    '\1 Color SHOCK\2'
  ),
  name_ru = regexp_replace(
    name_ru,
    '^Color SHOCK ([0-9]+\.[0-9]+)(.*)$',
    '\1 Color SHOCK\2'
  )
WHERE name_lt ~ '^Color SHOCK [0-9]+\.[0-9]';

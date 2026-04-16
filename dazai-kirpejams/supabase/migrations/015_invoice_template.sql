-- ============================================
-- INVOICE TEMPLATE CUSTOMIZATION
-- ============================================
--
-- Lygmuo 1: brand'o nustatymai (shop_settings) — keičiami iš
-- /admin/nustatymai. Prekės ženklo pavadinimas, šūkis, akcentinė
-- spalva, poraštės tekstas, standartinės pastabos, apmokėjimo
-- terminas dienomis. Šie nustatymai taikomi VISIEMS nauji išrašomoms
-- sąskaitoms. Jau išrašytos sąskaitos lieka nekintamos per brand_snapshot.
--
-- Lygmuo 2: per-invoice rankinis redagavimas prieš išrašymą
-- (/admin/uzsakymai/[id]/saskaita). Apmokėjimo terminas ir
-- individualios pastabos gali būti pakeistos konkrečiai sąskaitai.
--
-- brand_snapshot saugo brand'o nustatymų kopiją išrašymo momentu —
-- LR apskaitos įstatymas reikalauja, kad sąskaita būtų nekintama po
-- išrašymo, net jei admin'as vėliau pakeičia brand'o nustatymus.

-- Brand'o snapshot — analogas seller_snapshot, bet dėl dizaino/teksto
-- laukų (ne rekvizitų). Nullable, nes esamos sąskaitos neturi šio
-- snapshot'o — fallback'ins į hardcoded default'us PDF šablone.
alter table invoices
  add column if not exists brand_snapshot jsonb;

-- Apmokėjimo terminas — jei null, PDF'e nerodoma. Naudinga B2B
-- sąskaitoms su atidėtu mokėjimu (pvz. 14 d. po išrašymo).
alter table invoices
  add column if not exists payment_due_date date;

-- Individualios pastabos — pakeičia `orders.notes` (jei užpildyta),
-- kad admin'as galėtų redaguoti tik sąskaitos pastabas neliesdamas
-- užsakymo. Priority: custom_notes > orders.notes > invoice_default_notes.
alter table invoices
  add column if not exists custom_notes text;

-- ============================================
-- Dokumentacija: nauji shop_settings raktai
-- ============================================
--
-- Šios reikšmės užpildomos per /admin/nustatymai UI. App'as turi
-- fallback'us (hardcoded default'us) jei reikšmė neužpildyta, todėl
-- duomenų insert'ų čia nedarom.
--
--   invoice_brand_name          text    — pvz. "Dažai Kirpėjams"
--   invoice_brand_tagline       text    — pvz. "Profesionalūs plaukų dažai kirpėjams"
--   invoice_accent_color        text    — HEX, pvz. "#E91E8C"
--   invoice_footer_text         text    — laisvos formos poraštės eilutė
--   invoice_default_notes       text    — auto-injected į visas naujas sąskaitas
--   invoice_payment_terms_days  int     — default apmokėjimo terminas dienomis
--
-- Raktai dokumentuoti `src/lib/admin/queries.ts` SHOP_SETTINGS_KEYS
-- enum'e (app'o lygmuo — ne DB constraint).

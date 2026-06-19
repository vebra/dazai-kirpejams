# Developerio instrukcija — www.dazaikirpejams.lt

Šis dokumentas aprašo, kaip svetainė yra techniškai sukurta: architektūrą, duomenų bazę, pirkimo srautą, admin ir vadybininkės zonas, integracijas, diegimą ir svarbiausias taisykles, kurių privaloma laikytis keičiant kodą.

Paskutinį kartą atnaujinta: 2026-06-12.

---

## 1. Technologijos ir bendras vaizdas

| Sritis | Sprendimas |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** + TypeScript |
| Duomenų bazė ir auth | **Supabase** (PostgreSQL, Auth, Storage, RLS) |
| Hostingas | **Vercel** (produkcija iš `master` šakos, preview iš PR) |
| Stiliai | **Tailwind CSS 4** (`@theme inline`, be `tailwind.config.ts`) |
| Būsenos valdymas | **Zustand** (krepšelis, localStorage) + React Context (verifikacija) |
| El. laiškai | **Resend** |
| PDF sąskaitos | **@react-pdf/renderer** |
| Klaidos | **Sentry** (2 % trace sampling produkcijoje) |
| Analitika | **GA4** + **Meta Pixel + Conversions API (CAPI)** |
| Validacija | **Zod** |
| Testai | **Vitest** (unit) + **Playwright** (e2e) |

Verslo logikos esmė: vieša el. parduotuvė, kurioje **kainos rodomos tik patvirtintiems profesionalams** (kirpėjams/salonams), su admin panele, sandėlio apskaita ir vadybininkės (konsignacijos) srautu.

---

## 2. Repozitorijos struktūra

```
Dazai Kirpejams/                  ← git šaknis
├── CLAUDE.md                     ← verslo taisyklės, brandbook'as, puslapių struktūra
├── NAUDOJIMO-INSTRUKCIJA.md      ← naudotojo (admin) instrukcija
├── DEVELOPERIO-INSTRUKCIJA.md    ← šis dokumentas
├── dazai-kirpejams/              ← Next.js aplikacija (visas kodas čia)
│   ├── src/
│   │   ├── app/                  ← maršrutai (route groups: (site), (admin), (rep), api, auth)
│   │   ├── components/           ← UI komponentai pagal sritis
│   │   ├── lib/                  ← verslo logika (commerce, email, invoices, admin, rep, auth...)
│   │   ├── i18n/                 ← LT/EN/RU žodynai
│   │   └── proxy.ts              ← middleware (kalbos, auth, sesijos atnaujinimas)
│   ├── supabase/
│   │   ├── migrations/           ← 001–072 SQL migracijos (taikomos RANKINIU būdu!)
│   │   └── smoke/                ← po-migracijų patikros skriptai
│   ├── scripts/                  ← seed, admin kūrimas, tiekėjo CSV importas...
│   ├── e2e/                      ← Playwright testai
│   ├── next.config.ts, vercel.json, playwright.config.ts, vitest.config.ts
│   └── README.md, SETUP.md, AGENTS.md (Next.js 16 įspėjimai)
├── marketing/, screenshots/, scripts/, _archive/
```

---

## 3. Lokalus paleidimas

```bash
cd dazai-kirpejams
npm install
# sukurkite .env.local (žr. 16 skyrių — aplinkos kintamieji)
npm run dev          # http://localhost:3000
```

Naudingos komandos:

| Komanda | Paskirtis |
|---|---|
| `npm run build` | Produkcinis buildas (statinių puslapių generacija) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript patikra |
| `npm run test` | Vitest unit testai |
| `npm run test:e2e` | Playwright e2e testai |
| `npm run db:seed` | Pradinis DB užpildymas (`scripts/seed.ts`) |
| `npm run admin:create -- email slaptazodis` | Sukurti admin vartotoją |
| `npm run import:supplier` | Importuoti tiekėjo (RosaNera) CSV katalogą |

Kiti skriptai `scripts/` kataloge: `create-rep-account.ts` (vadybininkės paskyra), `migrate-articles-to-db.ts`, `regenerate-all-invoices.mjs`, `translate-blog-posts.mjs`, `check-db.ts`.

---

## 4. Maršrutai ir route groups

`src/app` padalintas į tris izoliuotas zonas:

### 4.1. `(site)` — vieša svetainė, `/[lang]/...`

Visi vieši puslapiai gyvena po `[lang]` segmentu (lt/en/ru). Pagrindiniai:

- `/` — pagrindinis; `/produktai`, `/produktai/[category]`, `/produktai/[category]/[slug]` — katalogas
- `/spalvu-palete`, `/skaiciuokle`, `/blogas`, `/blogas/[slug]`, `/autorius/[slug]`
- `/salonams` (B2B forma), `/apie-mus`, `/kontaktai`, `/duk`, `/pristatymas`, `/pirkimo-salygos`, `/privatumo-politika`, `/duomenu-trynimas`
- `/renginys`, `/renginys/[slug]` — renginiai su registracija
- `/registracija`, `/prisijungimas`, `/atstatyti-slaptazodi`, `/naujas-slaptazodis`, `/paskyra`
- `/krepselis`, `/apmokejimas` (checkout), `/uzsakymas/[orderNumber]` (užsakymo peržiūra su magic-link žetonu)
- `/atsisiuntimai` — prisijungusiems skirti failai (force-dynamic)

### 4.2. `(admin)` — `/admin/...`

Visa administracija (žr. 11 skyrių). Visi puslapiai `force-dynamic`, kiekvienas saugomas `requireAdmin()`.

### 4.3. `(rep)` — `/vadybininke/...`

Vadybininkės portalas (žr. 12 skyrių). Saugomas `requireSalesRep()`.

### 4.4. `api/` ir `auth/`

- `/api/omniva-lockers` — Omniva paštomatų sąrašas (24 h kešas)
- `/api/track/open/[id]` — kampanijų laiškų atidarymo pikselis (1×1 PNG)
- `/api/banner-stats` — banerių parodymų/paspaudimų registravimas
- `/api/cron/event-reminders` ir `/api/cron/weekly-admin-summary` — Vercel cron (saugomi `CRON_SECRET`)
- `/auth/callback`, `/auth/recovery` — Supabase auth callback'ai

---

## 5. Kalbos (i18n)

- Konfigūracija: `src/i18n/config.ts` — `['lt', 'en', 'ru']`, numatytoji `lt`.
- Žodynai: `src/i18n/dictionaries/{lt,en,ru}.json`, kraunami per `getDictionary(locale)` serverio pusėje.
- **URL struktūra:** LT be priešdėlio (`/produktai`), EN/RU su priešdėliu (`/en/produktai`, `/ru/produktai`). Vidinai LT URL'as proxy'je perrašomas (rewrite) į `/lt/...`. `/lt/...` viešai nukreipiamas (301) į versiją be priešdėlio.
- hreflang alternatyvos generuojamos per `buildLanguageAlternates()` (`src/lib/seo.ts`), `x-default` → LT.

---

## 6. Proxy / middleware (`src/proxy.ts`)

Vykdomas su kiekviena užklausa (išskyrus statinius failus). Atsakomybės:

1. **Supabase sesijos atnaujinimas** — jei auth slapukas baigia galioti (< 5 min), iškviečiamas `getUser()`; anoniminėms užklausoms Supabase nekviečiamas (kvotos taupymas). Tai sprendžia „tylaus atsijungimo" problemą, kai dingdavo kainos.
2. **Lowercase redirect** (SEO) — `/Produktai` → `/produktai` (301). **IŠIMTIS: `/uzsakymas/...`** — užsakymų numeriai (`DK-260520-160345`) yra case-sensitive, jų mažinti negalima.
3. **Admin / rep apsauga** — `/admin/*` ir `/vadybininke/*` be sesijos nukreipiami į atitinkamą login. Tikroji autorizacija (allow-list) vyksta puslapio lygyje.
4. **Kalbų maršrutizavimas** (žr. 5 skyrių).
5. **Slapukų kopijavimas** per redirect/rewrite — kad atnaujinti auth slapukai pasiektų naršyklę.

---

## 7. Renderinimo ir spartos strategija

**Pamatinė taisyklė: visa vieša parduotuvė yra statinė (ISR).** Puslapiai generuojami build'o metu (`generateStaticParams`) ir atnaujinami per `revalidate`:

| Puslapiai | revalidate |
|---|---|
| Pagrindinis, katalogas, produktai, blogas, paletė, renginiai | 60 s |
| Apie mus, DUK, kontaktai, skaičiuoklė, teisiniai | 300 s |
| Sitemap | 3600 s |
| Admin, rep, atsisiuntimai, API | force-dynamic |

Papildomai admin veiksmai kviečia `revalidatePath`/`revalidateTag` (baneriai, blogas, produktai), kad pakeitimai matytųsi iškart.

**KRITINĖ TAISYKLĖ:** niekada nekvieskite `cookies()`, `headers()` ar auth funkcijų **root layout'e** ar bendruose statinių puslapių komponentuose — tai paverčia VISĄ svetainę dinamine ir sugriauna statinį renderinimą. Kainos ir vartotojo būsena gaunamos kliento pusėje (žr. 8 skyrių).

**Payload dieta:** listingų užklausos traukia tik minimalų laukų rinkinį (`id`, `slug`, pavadinimai, kaina, pirma nuotrauka) — pilni duomenys tik produkto puslapyje. Tai dalis Vercel sąnaudų mažinimo (kartu su Sentry 2 % sampling ir proxy refresh tik kai reikia).

Nuotraukos: tik WebP, ribotos breakpoint'ų reikšmės, 31 d. kešas (Vercel Image Optimization sąnaudų mažinimas).

---

## 8. Autentifikacija ir kainų rodymas (gating)

### 8.1. Supabase klientai (`src/lib/supabase/`)

| Klientas | Failas | Paskirtis |
|---|---|---|
| Naršyklės (anon) | `browser.ts` | Kliento pusė, galioja RLS |
| SSR (vartotojo sesija) | `ssr.ts` → `createServerSupabase()` | Serverio komponentai su slapukais, galioja RLS |
| Service role | `server.ts` → `createServerClient()` | Apeina RLS; tik už `requireAdmin()`/serverio veiksmų |

### 8.2. Registracija ir verifikacija

1. `/registracija` — privalomi laukai, 3 vaidmenų mygtukai (kirpėja/salonas/kita), dokumento įkėlimas, 30 min patvirtinimo pažadas. Adminas gauna laišką su dokumentu.
2. Sukuriamas `user_profiles` įrašas su `verification_status='pending'`.
3. Adminas patvirtina per `/admin/verifikacija` arba `/admin/patvirtinimai` → vartotojui išsiunčiamas welcome laiškas (LT/EN/RU pagal registracijos kalbą).
4. Migracija 069: trigeris neleidžia vartotojui pačiam pasikeisti `verification_status` ar `role`.

### 8.3. Kainų gating'as

Kainos rodomos **tik patvirtintiems** (`verification_status='approved'`):

- Statiniame HTML kainų **nėra** (puslapiai renderinami kaip svečiui; `stripProductPricing()` `src/lib/data/pricing-gate.ts`).
- Kliento pusėje `VerificationProvider` (`src/components/auth/VerificationProvider.tsx`) + `useVerifiedUser` hook'as nustato būseną per RPC `get_my_verification_status`.
- Patvirtintam vartotojui `ProductPricesProvider` vienu RPC `get_product_prices(ids[])` (migracija 068; serveris tikrina approved statusą) parsiunčia visas puslapio kainas ir kešuoja Context'e.
- **Mobiliesiems būtina `getSession()`, ne `getUser()`** — kitaip kainos nepasirodo.
- Gating'as yra UX sluoksnis, **ne saugumo riba** — užsakymo kainos VISADA perskaičiuojamos serveryje (migracija 065).

---

## 9. Duomenų bazė (Supabase)

### 9.1. Migracijų taikymas — RANKINIS

**Supabase CLI nenaudojamas.** Migracijos (`supabase/migrations/NNN_*.sql`) taikomos kopijuojant turinį į **Supabase Dashboard → SQL Editor** ir paleidžiant. Visos migracijos idempotentiškos (`IF NOT EXISTS`, `ON CONFLICT`).

**SVARBU:** jei migracija sukuria/keičia funkciją (RPC), prieš deploy'inant kodą būtina paleisti:
```sql
NOTIFY pgrst, 'reload schema';
```
Kitaip gyvame puslapyje RPC kvietimai grąžins `PGRST202` (PostgREST nemato naujos funkcijos).

`supabase/smoke/` — patikros skriptai po migracijų (pvz., `032_create_order_atomic_smoke.sql` — paleidžiamas SQL Editor'iuje, testuoja užsakymo kūrimą savepoint'uose, DB lieka švari).

### 9.2. Pagrindinės lentelės

| Lentelė | Paskirtis |
|---|---|
| `products` | Katalogas: LT/EN/RU tekstai, `price_cents`/`sale_price_cents`/`b2b_price_cents`/`cost_price_cents`, EAN, SKU, spalvos laukai (numeris/hex/tonas/šeima), `stock_quantity`, variantai (`variant_group/size`), info laukai |
| `products_public` (VIEW) | Vieša produkto versija **be** savikainos ir B2B kainų (migracijos 066–067) |
| `categories`, `brands` | Kategorijos ir prekių ženklai (LT/EN/RU) |
| `orders` | Užsakymai: klientas, pristatymas, mokėjimas, sumos, `status` + `payment_status`, tracking, rep laukai (`placed_by`, `approval_status`...) |
| `order_items` | Eilutės su produkto pavadinimo/kainos momentinėmis kopijomis |
| `user_profiles` | Profesionalų profiliai + verifikacija + `role` (client/sales_rep) |
| `admin_users` | Admin allow-list (`is_admin()` funkcija) |
| `shop_settings` | **Key-value** parduotuvės nustatymai: banko rekvizitai, įmonės info, PVM, pristatymo kainos, nemokamo pristatymo riba, sąskaitų nustatymai. Naujam raktui migracijos nereikia |
| `discount_codes` | Kuponai (percent/fixed, ribos, galiojimas, `used_count`) |
| `invoices`, `invoice_counters` | Sąskaitos su pardavėjo/pirkėjo snapshot'ais; atominė numeracija per metus |
| `stock_movements` | Sandėlio judėjimo žurnalas (delta, likutis po, priežastis, šaltinis, rep_id) |
| `stock_revisions` | Revizijų (inventorizacijų) suvestinės su JSONB detalėmis |
| `clients`, `product_prices` | Vadybininkės klientai ir didmeninių kainų pakopos (wholesale_1/2/3) |
| `blog_posts` | Blogo straipsniai (LT/EN/RU). **DĖMESIO:** gyvas turinys DB nebeatitinka `articles.ts` — redaguojant skaityti iš DB |
| `banners`, `banner_events` | Baneriai + parodymų/paspaudimų statistika (`banner_event_counts` view) |
| `events`, `event_registrations` | Renginiai ir registracijos |
| `marketing_campaigns`, `marketing_campaign_recipients` | Kampanijos ir siuntimų/atidarymų žurnalas |
| `b2b_inquiries`, `contact_messages`, `newsletter_subscribers` | Formų duomenys |
| `downloads` | Atsisiunčiami failai |
| `rate_limits` | Formų throttling skaitikliai |

Storage bucket'ai: `products`, `blog`, `events` (vieši), `invoices`, `verification_docs` (privatūs).

### 9.3. Svarbiausios RPC funkcijos (SECURITY DEFINER)

| Funkcija | Paskirtis |
|---|---|
| `create_order_atomic(...)` | **Užsakymo kūrimo širdis.** Viena tranzakcija: kuponas + sandėlio nurašymas + orders + order_items. Nuo migracijos 065 kainos imamos **iš DB serverio pusėje** (kliento kainos tik validuojamos, mismatch → atmetimas). Grąžina `{ok, ...}` arba `{ok:false, reason}` |
| `get_product_prices(ids[])` | Kainos tik approved profesionalams |
| `get_my_verification_status()` | Savo verifikacijos būsena |
| `validate_discount_code_v2` / `apply_discount_code_v2` | Kupono peržiūra (be šalutinių efektų) / atominis pritaikymas |
| `receive_stock_by_ean(ean, delta)` | Prekių priėmimas skeneriu |
| `set_product_stock`, `restore_stock_by_order_id`, `write_off_stock` | Korekcijos, atstatymas atšaukus, nurašymas |
| `issue_stock_to_rep_batch`, `return_stock_from_rep` | Konsignacija: išdavimas/grąžinimas (atominis batch'as) |
| `create_rep_order`, `approve_rep_order_from_warehouse` | Vadybininkės užsakymas; patvirtinimas nurašant iš centrinio sandėlio |
| `next_invoice_number()` | Atominė sąskaitų numeracija (SF-YYYY-NNNN) |
| `is_admin()` | Naudojama RLS politikose |
| `check_rate_limit(...)` | Formų rate limiting |

### 9.4. RLS modelis

Keturios pakopos: **anon** (viešas katalogas per `products_public`, blogas, baneriai; formų INSERT), **authenticated** (savo profilis, kainų RPC), **admin** (`is_admin()` politikos), **service_role** (apeina RLS, tik serverio kodui).

**Saugumo grūdinimo serija 064–069 (2026-06-10 auditas):**
- 064 — atimti pavojingi grant'ai (stock funkcijos, v1 kuponai, `discount_codes`/`shop_settings` viešas skaitymas, sąskaitų numeracija)
- 065 — kainos serverio pusėje `create_order_atomic` v3
- 066–067 — savikaina/B2B kainos paslėptos per `products_public` VIEW (dviejų etapų diegimas)
- 068 — `get_product_prices` RPC su verifikacijos patikra
- 069 — trigeris prieš savęs patvirtinimą / rolės pakėlimą

**ĮSPĖJIMAS iš praktikos:** griežtinant RLS visada patikrinkite vartotojo sesijos kelius — 064 buvo netyčia nulaužęs banko rekvizitus checkout laiškuose (`getCompanyInfo` dabar eina per service_role).

---

## 10. Pirkimo srautas (checkout)

### 10.1. Krepšelis

`src/lib/commerce/cart-store.ts` — Zustand su `localStorage` (raktas `dk-cart`). Įdedant prekę daromas snapshot'as (pavadinimas, kaina, nuotrauka). Hidratacijos saugikliai (`useCartCount()` grąžina 0 iki mount'o). Prieš checkout kainos atnaujinamos per `useRefreshCartPrices` (RPC `get_product_prices`).

### 10.2. Checkout (`/apmokejimas`)

1. Tik verifikuotiems (`isUserVerified()`; kitaip redirect į prisijungimą).
2. Forma užpildoma iš `user_profiles.last_delivery_data`.
3. Pristatymas: kurjeris / **Omniva paštomatas** (picker'is iš oficialaus Omniva sąrašo, 24 h kešas, fallback į rankinį įvedimą) / atsiėmimas. **Kainos imamos iš `shop_settings` (per /admin/kainos)** — kodo konstantos (`src/lib/commerce/constants.ts`) yra tik fallback. Nemokamas pristatymas skaičiuojamas nuo subtotal PRIEŠ nuolaidą.
4. Mokėjimas: **banko pavedimas** (pilnai veikia — rekvizitai laiške iš `shop_settings`); Paysera UI yra, bet kol kas fallback'ina į pavedimą (laukiama raktų); Stripe tik tipuose.

### 10.3. Užsakymo sukūrimas (`src/lib/commerce/order-actions.ts: createOrder()`)

1. Validacija (min. suma, laukai) → `create_order_atomic` RPC (žr. 9.3). Numerio formatas `DK-YYMMDD-XXXXXX`, kolizijos atveju regeneruojamas (iki 3 kartų).
2. Po sėkmės (neblokuojančiai): laiškas klientui (su banko rekvizitais), laiškas adminui, Meta CAPI Purchase eventas (dedupe su Pixel per `event_id`), slapukas `dk-order-{nr}` (30 min) patvirtinimo puslapiui be DB.
3. `user_profiles.last_delivery_data` atnaujinimas kitam kartui.

### 10.4. Užsakymo gyvavimo ciklas

`pending → paid → processing → shipped → delivered` (arba `cancelled/refunded`). `payment_status` automatiškai sinchronizuojamas su `status`. Statusų keitimas siunčia auto-laiškus (paid — su PDF sąskaita, shipped — su tracking nuoroda, delivered, cancelled).

**Kliento savitarna „Siunta gauta":** `/uzsakymas/[orderNumber]?token=...` — HMAC-SHA256 žetonas (`src/lib/orders/view-token.ts`, pasirašytas `SUPABASE_SERVICE_ROLE_KEY`, 30 d. TTL) ARBA prisijungusio vartotojo el. paštas sutampa su užsakymo. Veiksmas `markOrderReceivedAction` keičia tik shipped → delivered, idempotentiškas.

---

## 11. El. laiškai

- Siuntimas: `src/lib/email/resend.ts: sendEmail()` — jei Resend nesukonfigūruotas, grąžina `{ok:false}` ir **neblokuoja** užsakymo srauto; klaidos į Sentry.
- Šablonai: `templates.ts` (užsakymai/statusai/sąskaitos), `auth-templates.ts` (welcome), `campaign-template.ts`, `admin-summary-template.ts`.
- **Lokalizacija — „copy table" šablonas:** tekstai laikomi `Record<EmailLang, Record<string,string>>`. Kalbos šaltinis priklauso nuo srauto: užsakymo laiškai — `input.locale` (checkout kalba), welcome — registracijos kalba (`user_profiles`), admin laiškai — visada LT.
- Dizainas: inline CSS, table layout'ai, max 600 px, brand spalvos, plain-text fallback.
- Banko rekvizitų blokas rodomas tik jei `payment_method='bank_transfer'` IR `shop_settings` turi `bank_recipient` + `bank_iban` (gaunama per service_role!).

---

## 12. Sąskaitos faktūros

`src/lib/invoices/generate.ts: generateInvoiceForOrder()`:

1. Idempotentiška (jei sąskaita jau yra — grąžina esamą).
2. Numeris per `next_invoice_number()` RPC (atominis, be tarpų, per metus).
3. Snapshot'ai: pardavėjas iš `shop_settings`, pirkėjas iš užsakymo, eilutės iš `order_items` — sąskaita nesikeičia pakeitus nustatymus (LR teisės reikalavimas).
4. PDF per `@react-pdf/renderer` (`pdf-template.tsx`) → Supabase Storage `invoices/{metai}/{numeris}.pdf`.
5. PVM: jei įmonė turi PVM kodą → 21 % ir „PVM sąskaita faktūra", kitaip 0 % ir „Sąskaita faktūra".
6. Yra `regenerateInvoiceForOrder()` (po užsakymo redagavimo) ir `regeneratePdfOnly()`.

`@react-pdf/renderer` įtrauktas į `serverExternalPackages` (next.config.ts) — nebandykite jo bundle'inti.

---

## 13. Admin zona (`/admin`)

### 13.1. Autorizacija

`src/lib/admin/auth.ts`: `requireAdmin()` kiekviename puslapyje/veiksme → tikrina `auth.getUser()` + `admin_users` lentelę; ne-adminas atjungiamas ir nukreipiamas į login. Duomenų užklausos (`src/lib/admin/queries.ts`, ~2100 eilučių) dažnai eina per **service_role** (pvz., `getAdminProducts` — nes `cost_price_cents` po 067 migracijos nepasiekiamas authenticated rolei). Tai saugu tik todėl, kad puslapį saugo `requireAdmin()` — **niekada nekvieskite service_role užklausų be šio guard'o**.

### 13.2. Puslapių žemėlapis

| Sritis | Maršrutai |
|---|---|
| Dashboard | `/admin` (KPI, paskutiniai užsakymai, žemi likučiai) |
| Užsakymai | `/admin/uzsakymai`, `[id]`, `[id]/saskaita`, `naujas` (rankinis užsakymas), `eksportas` |
| Sandėlis | `/admin/sandelis` + `naujas`, `[id]`, `priemimas` (skeneris pagal EAN), `isdavimas` / `isduota` / `grazinimas` (konsignacija), `revizija` + `revizija/istorija`, `nurasymas`, `savo-naudojimui` (+ ataskaita), `suderinimas`, `uzsakyti` (tiekėjo lapas), `spausdinti`, `zurnalas` (judėjimo žurnalas) |
| Kainos | `/admin/kainos` (kainos, akcijos, kuponai, pristatymo įkainiai, parduotuvės nustatymai), `/admin/didmenos-kainos` (wholesale pakopos) |
| Klientai | `/admin/klientai`, `[email]`, `/admin/verifikacija` (+ `naujas`), `/admin/patvirtinimai` |
| Marketingas | `/admin/kampanijos` (+ `nauja`, `[id]`, `zurnalas`), `/admin/naujienlaiskiai`, `/admin/baneriai` (+ `naujas`, `[id]`) |
| Turinys | `/admin/blogas` (+ `naujas`, `[id]`), `/admin/renginiai` (+ `naujas`, `[slug]/redaguoti`, `spausdinti`, `eksportas`), `/admin/atsisiuntimai` |
| Kita | `/admin/ataskaitos`, `/admin/b2b`, `/admin/vadybininkes`, `/admin/nustatymai` |

### 13.3. Sandėlio mechanika

- Kiekvienas likučio pokytis registruojamas `stock_movements` (delta, likutis po, priežastis: receiving/sale/cancel_restore/correction/issue_to_rep/rep_return/write_off/own_use, šaltinis).
- **Skeneris:** EAN paieška + `ScanFeedback` komponentas (`src/components/admin/ScanFeedback.tsx`) — garsas (880 Hz ok / 520 Hz warn / 240 Hz fail), vibracija, vizualus blyksnis. Naudojamas priėmime, išdavime, revizijoje.
- Revizija (071): suskaičiuojami faktiniai likučiai, pritaikomi skirtumai, suvestinė į `stock_revisions`.
- Žemo likučio laiškas adminui; `reorder_point` stulpelis užsakymo taškui.

### 13.4. Baneriai

- Rankiniai baneriai `banners` lentelėje (LT/EN/RU, CTA, spalvos, `starts_at`/`ends_at`, rodymo būsenos).
- **Auto renginio juosta:** artėjantis renginys automatiškai tampa skelbimo juosta (raktas `event:<slug>`, be DB eilutės `banners`). Rankinis aktyvus baneris turi pirmenybę.
- Statistika: frontend'as siunčia į `/api/banner-stats` → `banner_events`; adminas mato agregatus per `banner_event_counts` view.

### 13.5. Blogas

Hibridinis: gyvi straipsniai **DB** (`blog_posts`), `src/lib/data/articles.ts` — tik istorinis fallback/seed. **Gyvas turinys DB perrašytas ir NEBEATITINKA articles.ts** — prieš redaguojant visada skaityti iš DB.

---

## 14. Vadybininkės zona (`/vadybininke`) ir konsignacija

Autorizacija: `src/lib/rep/auth.ts: requireSalesRep()` — leidžia `user_profiles.role='sales_rep'` ARBA adminą.

Puslapiai: dashboard, `naujas-uzsakymas`, `uzsakymai` (+ `[id]`), `klientai` (+ `[id]`), `atsargos` (išduotos prekės).

**Konsignacijos srautas (pilnai prode):**

1. Adminas išduoda prekes vadybininkei (`/admin/sandelis/isdavimas`, `issue_stock_to_rep_batch` — atominis, su pre-check'u).
2. Vadybininkė mato savo atsargas (`/vadybininke/atsargos`).
3. Vadybininkė kuria užsakymą klientui (`create_rep_order` — kainos iš `product_prices` pagal kliento pakopą wholesale_1/2/3; pakopą nustato tik adminas per trigerį; cash/card mokėjimai iškart `paid`). Pardavimas gali eiti iš rep atsargų (konsignacinis pardavimas, 062).
4. Adminas tvirtina (`approve_rep_order_from_warehouse` — nurašoma iš centrinio sandėlio) arba atmeta.
5. Neparduotos prekės grąžinamos (`return_stock_from_rep`).

RLS: vadybininkė mato tik savo klientus (`created_by`) ir savo užsakymus (`placed_by`).

---

## 15. SEO, analitika, stebėsena

### 15.1. SEO

- `src/app/sitemap.ts` — dinaminis sitemap (statiniai puslapiai + kategorijos + produktai + blogas + autoriai, × 3 kalbos, su hreflang; revalidate 3600).
- `src/app/robots.ts` — blokuoja /api, /admin, krepšelį, checkout; blokuoja CCBot, Bytespider.
- Struktūruoti duomenys: `src/lib/schema.ts` (Organization, Product+Offer, BlogPosting, FAQPage, Event, BreadcrumbList...) per `<JsonLd />` komponentą. Produkto kaina į schemą dedama tik jei vieša (>0).
- OG: pagrindinė kortelė — **statinis JPG** (`/og-image.jpg`), produktams ir blogui — file-based `opengraph-image.tsx`. Vaizdams naudojamas `sharp`; **ImageMagick Windows aplinkoje nėra**.

### 15.2. Analitika

- GA4 (`analytics-ga4.ts`) + Meta Pixel (`analytics-meta.ts`) kliento pusėje; standartiniai e-commerce eventai + custom (PriceUnlockClick, CalculatorUsed...).
- **Meta CAPI** (`analytics-capi.ts`) — serverio Purchase/Lead eventai (iOS/ITP), dedupe per bendrą `event_id` su Pixel, PII hash'inama SHA-256. Klaidos neblokuoja checkout. Token'as — nesibaigiantis System User token (regeneruoti nereikia).
- Sutikimai: `CookieConsent` (localStorage `cookie-consent-v1`) → GA4 Consent Mode + `fbq('consent', ...)`. Iki sutikimo — viskas revoked/denied.

### 15.3. Sentry

`instrumentation.ts` / `instrumentation-client.ts` / `sentry.{server,edge}.config.ts`. Produkcijoje **2 % trace sampling** (sąnaudos), error replay 100 %, tuneliavimas per `/monitoring` (ad-block apėjimas), `sendDefaultPii: false`. Triukšmas (NEXT_REDIRECT, hidratacijos, naršyklių plėtiniai) ignoruojamas.

---

## 16. Aplinkos kintamieji

| Kintamasis | Kur | Paskirtis |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | viešas | Supabase projekto URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | viešas | Anon raktas |
| `SUPABASE_SERVICE_ROLE_KEY` | tik serveris | Service role; taip pat HMAC žetonų raktas |
| `NEXT_PUBLIC_SITE_URL` | viešas | Kanoninis URL (laiškams, schemoms) |
| `RESEND_API_KEY`, `RESEND_FROM` | serveris | El. laiškai |
| `ADMIN_NOTIFICATION_EMAIL`, `B2B_NOTIFICATION_EMAIL` | serveris | Pranešimų gavėjai |
| `PAYSERA_PROJECT_ID`, `PAYSERA_SIGN_PASSWORD` | serveris | Paysera (paruošta, dar neaktyvuota) |
| `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` | mišrūs | Meta Pixel + CAPI |
| `NEXT_PUBLIC_GA_ID` | viešas | GA4 |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | mišrūs | Sentry (token tik build'ui, source maps) |
| `RATE_LIMIT_SALT` | serveris | IP hash'avimo druska |
| `CRON_SECRET` | serveris | Vercel cron apsauga |

**ĮSPĖJIMAS — pasikartojanti prod klaida (env drift):** Vercel'e būdavo `SUPABASE_SERVICE_ROLE_KEY` = anon raktas ir `SUPABASE_URL` = svetainės domenas. Diagnozuoti tik su šviežiu `vercel env pull`; taisyti per Vercel REST API/Dashboard.

---

## 17. Diegimas (deploy)

1. **Produkcija:** push į `master` → Vercel automatinis build'as. GitHub Actions CI daro build + testus.
2. **Preview:** PR → preview deploy. Preview yra **SSO apsaugotas** — automatiniams testams naudokite `x-vercel-protection-bypass` header'į (secret Vercel nustatymuose). Checkout testams preview'e — laikinas approved vartotojas per service_role.
3. **PRIVALOMA TVARKA su DB pakeitimais:** (a) migracija per SQL Editor → (b) `NOTIFY pgrst, 'reload schema';` → (c) kodo deploy.
4. **PRIVALOMA TAISYKLĖ:** komerciniai / auth-gated pakeitimai (kainos, krepšelis, checkout) **visada testuojami per Vercel preview PRIEŠ prod** — 2026-06-03 kainų/krepšelio refaktoringas be preview buvo sugriovęs produkciją.
5. Cron'ai (`vercel.json`): renginių priminimai kasdien 8:00 UTC, savaitinė admin suvestinė pirmadieniais 6:00 UTC.

---

## 18. Testavimas

- **Unit (Vitest):** `npm run test` — analitikos util'ai ir helper'iai (`*.test.ts` šalia kodo).
- **E2E (Playwright):** `e2e/` — `smoke.spec.ts` (navigacija), `auth.spec.ts` (prisijungimas/registracija), `analytics.spec.ts` (eventų firing'as). Chromium desktop + mobile (Pixel 5). CI režime: 1 worker, 2 retry, trace/screenshot/video failure atveju.
- **DB smoke:** `supabase/smoke/` per SQL Editor.

---

## 19. Auksinės taisyklės (privaloma žinoti prieš keičiant kodą)

1. **Jokio `cookies()`/auth root layout'e** — sugriauna visos svetainės statinį renderinimą.
2. **Migracijos — rankiniu būdu** per Dashboard SQL Editor; po naujų RPC — `NOTIFY pgrst, 'reload schema'`.
3. **Kainos — serverio tiesa.** Kliento kainos tik UX; `create_order_atomic` perskaičiuoja iš DB.
4. **Pristatymo kainos ir banko rekvizitai — `shop_settings` DB**, ne kodo konstantos (jos tik fallback). Žodynų tekstai apie ribas (pvz., „nemokamas nuo 50 €") atnaujinami rankomis.
5. **`/uzsakymas/` URL'ai case-sensitive** — lowercase redirect'as jiems netaikomas.
6. **Griežtinant RLS** — patikrinti vartotojo sesijos kelius (laiškai, checkout); `getCompanyInfo` eina per service_role būtent dėl to.
7. **Mobiliame kainų gating'e — `getSession()`, ne `getUser()`.**
8. **Komerciniai pakeitimai — tik per preview** prieš prod.
9. **Blogo turinys — iš DB**, ne iš `articles.ts`.
10. **Kainų skaičiuoklė yra kainų palyginimo etalonas** (~11 € vs 7,90 €; 0,183 vs 0,044 €/ml) — marketingo tekstai turi jį atitikti.
11. Service_role klientas — tik už `requireAdmin()`/`requireSalesRep()` guard'ų arba grynai serverio srautuose.
12. `AGENTS.md` — Next.js 16 breaking changes pastabos; perskaityti prieš framework'o atnaujinimus.

---

## 20. Kur ieškoti ko (greita rodyklė)

| Noriu pakeisti... | Failas / vieta |
|---|---|
| Užsakymo kūrimo logiką | `src/lib/commerce/order-actions.ts` + `supabase/migrations/032`, `065` |
| Krepšelį | `src/lib/commerce/cart-store.ts` |
| Laiškų tekstus | `src/lib/email/templates.ts` (copy table LT/EN/RU) |
| Sąskaitos PDF | `src/lib/invoices/pdf-template.tsx` |
| Kainų rodymo logiką | `src/components/products/ProductPricesProvider.tsx`, `src/lib/data/pricing-gate.ts` |
| Kalbų tekstus (UI) | `src/i18n/dictionaries/{lt,en,ru}.json` |
| Pristatymo įkainius | `/admin/kainos` (DB), fallback `src/lib/commerce/constants.ts` |
| Admin užklausas | `src/lib/admin/queries.ts` |
| Vadybininkės logiką | `src/lib/rep/`, `supabase/migrations/043–063` |
| SEO / schemas | `src/lib/seo.ts`, `src/lib/schema.ts`, `src/app/sitemap.ts` |
| Kalbų/auth middleware | `src/proxy.ts` |
| Saugumo politikas | `supabase/migrations/064–069` |

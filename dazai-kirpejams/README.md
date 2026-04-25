# Dažai Kirpėjams — techninis README

Profesionalių plaukų dažų e-parduotuvė kirpėjams ir grožio salonams. Pagrindinis verslo išskirtinumas — **180 ml** pakuotė (vs. rinkos standarto 60–100 ml).

- **Domenas:** www.dazaikirpejams.lt
- **Prekių ženklai:** Dažai Kirpėjams (skėtis), Color SHOCK (dažai), RosaNera Cosmetic (kosmetika)
- **Modelis:** B2C + B2B (užklausos salonams)
- **Kalbos:** `lt` (numatytoji), `en`, `ru`

> Verslo taisyklės ir turinio tonas — žr. [../CLAUDE.md](../CLAUDE.md).
> Setup nuo nulio (Supabase + nuotraukos) — žr. [SETUP.md](SETUP.md).

---

## 1. Tech stack

| Sluoksnis | Sprendimas | Versija / pastabos |
| --- | --- | --- |
| Framework | Next.js App Router | `16.2.2` — ⚠️ žr. [AGENTS.md](AGENTS.md), yra breaking changes |
| UI | React | `19.2.4` |
| Stilius | Tailwind CSS v4 | `@tailwindcss/postcss` |
| Kalba | TypeScript | `^5` |
| DB + Auth + Storage | Supabase (Postgres) | `@supabase/ssr` + `@supabase/supabase-js` |
| State (krepšelis) | Zustand | `5.x`, localStorage persist |
| Email | Resend | transakciniai + B2B |
| PDF | `@react-pdf/renderer` | sąskaitos (server external) |
| Mokėjimai | Paysera (LT), Stripe (planas) | žr. `src/lib/commerce/paysera.ts` |
| Monitoringas | Sentry | `@sentry/nextjs` + tunnel `/monitoring` |
| Analitika | GA4 + Meta CAPI | server-side events |
| i18n | custom dictionaries + `@formatjs/intl-localematcher` | be `next-intl` |
| Testai | Playwright (E2E) | smoke, auth, analytics |
| Hostingas | Vercel | Frankfurt regionas |

---

## 2. Projekto struktūra

```
dazai-kirpejams/
├── src/
│   ├── app/
│   │   ├── (site)/[lang]/       # viešas e-shop, lokalizuotas per [lang] segmentą
│   │   │   ├── produktai/       # katalogas + produkto puslapis
│   │   │   ├── spalvu-palete/   # Color SHOCK paletės naršymas
│   │   │   ├── krepselis/       # krepšelis
│   │   │   ├── uzsakymas/       # checkout
│   │   │   ├── apmokejimas/     # Paysera callback landing
│   │   │   ├── paskyra/         # klientų paskyra + užsakymų istorija
│   │   │   ├── salonams/        # B2B
│   │   │   ├── skaiciuokle/     # 180 ml ekonominės naudos skaičiuoklė
│   │   │   ├── blogas/          # straipsniai + autoriai
│   │   │   ├── prisijungimas/   # login
│   │   │   └── registracija/    # signup
│   │   ├── (admin)/admin/       # admin panelė (atskiras root layout)
│   │   │   ├── uzsakymai/       # užsakymų valdymas
│   │   │   ├── sandelis/        # prekių likučiai
│   │   │   ├── kainos/          # kainodara + nuolaidos
│   │   │   ├── klientai/        # klientų sąrašas
│   │   │   ├── ataskaitos/      # pardavimų ataskaitos
│   │   │   ├── verifikacija/    # B2B verifikacija
│   │   │   ├── naujienlaiskiai/ # prenumeratoriai
│   │   │   ├── baneriai/        # hero baneriai
│   │   │   ├── blogas/          # blog'o valdymas
│   │   │   └── b2b/             # B2B užklausos
│   │   ├── auth/callback/       # Supabase OAuth/magic link redirect
│   │   ├── sitemap.ts           # dinaminis sitemap (produktai + blog'as)
│   │   └── robots.ts
│   ├── components/
│   │   ├── commerce/            # krepšelis, Add to cart, checkout form
│   │   ├── products/            # kortelės, filtrai, paletė
│   │   ├── home/                # hero, pasitikėjimo juosta, B2B CTA
│   │   ├── admin/               # admin UI
│   │   ├── analytics/           # GA/Meta klientinė pusė
│   │   ├── auth/                # login/signup UI
│   │   ├── calculator/          # 180 ml skaičiuoklė
│   │   ├── cookies/             # sutikimo banner'is
│   │   ├── layout/              # header, footer, lang switcher
│   │   ├── seo/                 # JSON-LD komponentai
│   │   └── ui/                  # primitives
│   ├── lib/
│   │   ├── supabase/            # browser / server / ssr klientai
│   │   ├── commerce/            # cart-store, order-actions, Paysera, nuolaidos
│   │   ├── data/                # queries.ts (DB) + mock-products.ts (fallback)
│   │   ├── auth/                # verifikuoto naudotojo helpers
│   │   ├── admin/               # admin query helpers + auth
│   │   ├── email/               # Resend klientas + šablonai
│   │   ├── invoices/            # PDF generavimas
│   │   ├── analytics-*.ts       # GA4, Meta CAPI, tipai, utils
│   │   ├── schema.ts            # JSON-LD schemos (Product, Organization, FAQ)
│   │   ├── seo.ts               # meta tag helpers
│   │   ├── rate-limit.ts        # formų apsauga
│   │   ├── sanitize.ts          # HTML sanitizacija blog'o turiniui
│   │   └── site.ts              # globalios konstantos (URL, kontaktai)
│   ├── i18n/
│   │   ├── config.ts            # locales: ['lt', 'en', 'ru']
│   │   ├── dictionaries.ts      # dict loader
│   │   └── dictionaries/        # lt.json, en.json, ru.json
│   ├── proxy.ts                 # lang detection + redirect middleware
│   ├── instrumentation.ts       # Sentry server
│   └── instrumentation-client.ts# Sentry browser
├── supabase/
│   └── migrations/              # 023 migracijos (žr. žemiau)
├── scripts/                     # seed, CSV import, admin kūrimas, PDF regenerate
├── e2e/                         # Playwright testai
├── docs/                        # Color SHOCK paletės PDF + swatches
├── public/                      # statinis turinys (OG image, favicon)
├── next.config.ts               # CSP, redirects, image remotePatterns, Sentry
├── playwright.config.ts
└── SETUP.md                     # setup nuo nulio
```

---

## 3. Environment kintamieji

Sukurti `.env.local` projekto šaknyje:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # SLAPTAS, tik server side

# Svetainė
NEXT_PUBLIC_SITE_URL=https://www.dazaikirpejams.lt

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=info@dazaikirpejams.lt

# Mokėjimai
PAYSERA_PROJECT_ID=...
PAYSERA_SIGN_PASSWORD=...
PAYSERA_TEST_MODE=1                         # 1 = sandbox, 0 = live
STRIPE_SECRET_KEY=sk_...                    # rezervuota ateičiai

# Analitika
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=...
META_CAPI_ACCESS_TOKEN=...                  # ⚠️ short-lived, tikrinti galiojimą
META_CAPI_TEST_EVENT_CODE=...               # tik dev testavimui

# Sentry
SENTRY_AUTH_TOKEN=...                       # tik build metu source map upload
```

Be Supabase rakto svetainė automatiškai krenta į `src/lib/data/mock-products.ts` — lokaliai galima dirbti be DB.

---

## 4. Paleidimas lokaliai

```bash
npm install
npm run dev                    # http://localhost:3000
```

Kiti scriptai:

| Komanda | Paskirtis |
| --- | --- |
| `npm run build` | produkcijos build'as (~149 statinių puslapių) |
| `npm run start` | paleisti build'ą lokaliai |
| `npm run lint` | ESLint |
| `npm run db:seed` | įkelti mock produktus į Supabase (idempotentiška pagal `slug`) |
| `npm run admin:create` | sukurti admin naudotoją |
| `npm run import:supplier` | CSV importas iš tiekėjo (pakeitimų nerenka, jei turinys identiškas) |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` | Playwright su UI |

---

## 5. Duomenų sluoksnis

### 5.1. Supabase schema

Pagrindinės lentelės (`supabase/migrations/001_initial_schema.sql`):

- `categories` — kategorijos (3 kalbos, slug, sort_order, is_active)
- `brands` — Color SHOCK, RosaNera Cosmetic
- `products` — 3 kalbos (`name_lt/en/ru`, `description_lt/en/ru`), `price_cents`, `volume_ml`, `stock_quantity`, `image_urls[]`, `is_featured`, `is_active`
- `orders`, `order_items` — užsakymai + pozicijos
- `user_profiles` — B2B verifikacijos laukai (`salon_name`, `is_verified`, `verification_status`)
- `discounts`, `discount_codes` — nuolaidų sistema
- `invoices` — sąskaitų metadata (PDF Storage bucket'e)
- `banners` — hero baneriai
- `blog_posts`, `blog_authors` — turinys
- `newsletter_subscribers` — prenumeratoriai
- `rate_limits` — formų throttling
- `site_settings` — runtime konfigas

Storage bucket'ai: `products`, `blog`, `invoices`.

### 5.2. Migracijų seka (23 failai)

Paleisti iš eilės per Supabase SQL Editor (arba `scripts/run-migration-*.ts`):

```
001 — schema            012 — baneriai          019 — mixing ratio fix
002 — seed              013 — invoices          020 — rate limits
003 — storage           014 — invoices storage  021 — newsletter upsert
004 — admin access      015 — invoice template  022 — Color SHOCK numeris pirmas
005 — ean + cost        016 — kaina 7.90        023 — oksidantų koncentracijos
006 — stock decrement   017 — Color SHOCK PDF
007 — order tracking    018 — user_profiles auto-create
008 — discounts         ...
```

### 5.3. Dviejų-šaltinių modelis

`src/lib/data/queries.ts` — visos skaitymo užklausos. Jei Supabase raktai nenustatyti arba URL turi `your-supabase`, automatiškai naudojamas `mock-products.ts` (tie patys ~32 produktai). `getDataSourceInfo()` grąžina `'supabase'` arba `'mock'`.

---

## 6. Domeno modeliai

### 6.1. i18n

- Trys kalbos: `lt` (default), `en`, `ru` — `src/i18n/config.ts`.
- URL forma: `/lt/produktai/...`, `/en/...`, `/ru/...`.
- `src/proxy.ts` (Next.js middleware) — detektuoja kalbą iš `Accept-Language`, perkeliu į tinkamą prefiksą.
- Tekstai: `src/i18n/dictionaries/{lt,en,ru}.json`.
- DB eilutės turi `_lt` / `_en` / `_ru` variantus — `queries.ts` pasirenka pagal `locale` parametrą.

### 6.2. Commerce flow

1. **Krepšelis** — `src/lib/commerce/cart-store.ts` (Zustand + localStorage). Tik `product_id` + `quantity`; kainos ir stock tikrinami server side užsakymo metu.
2. **Checkout** — `src/components/commerce/CheckoutForm.tsx` → `order-actions.ts` server action.
3. **Order** — `createOrder()` validuoja stock (`006_stock_decrement.sql` funkcija), pritaiko nuolaidą, sukuria `orders` + `order_items` įrašus.
4. **Apmokėjimas** — `paysera.ts` sugeneruoja pasirašytą request'ą, nukreipia į Paysera.
5. **Callback** — Paysera → `/apmokejimas` → statuso patikrinimas.
6. **Email** — `src/lib/email/templates.ts` per Resend, sąskaita PDF sugeneruojama ir įkeliama į `invoices` bucket.

### 6.3. B2B

- Forma: `src/app/(site)/[lang]/salonams/` + home `/` (iš commit `d5f6e12`).
- Verslo klientai gauna `user_profiles.verification_status = 'pending'` → admin `verifikacija/` panelė patvirtina → `is_verified = true` atrakina B2B kainas.

### 6.4. Admin

- Atskira route grupė `(admin)/admin/` su savo `layout.tsx` ir auth apsauga per `src/lib/admin/auth.ts`.
- CSV importas: `scripts/import-supplier-csv.ts` — praleidžia eilutę, jei turinys identiškas (žr. commit `bc6c478`).
- Sąskaitų regeneravimas: `scripts/regenerate-all-invoices.mjs`.

### 6.5. SEO ir schema

- `src/lib/schema.ts` — JSON-LD: `Product` (inline shipping/return, fallback description — žr. commit `27ac3d6`), `Organization`, `FAQPage`, `BreadcrumbList`.
- `src/app/sitemap.ts` — dinaminis sitemap iš DB.
- Kanoninis non-www → www redirect `next.config.ts`.

### 6.6. Analitika

- Client side: GA4 + Meta Pixel (`src/components/analytics/`).
- Server side: Meta CAPI (`src/lib/analytics-capi.ts`) — užsakymo `Purchase` eventas siunčiamas iš serverio, su `event_id` deduplicationui su pikseliu.
- ⚠️ Meta CAPI token short-lived — regeneruoti iki **2026-06-16**.

---

## 7. Saugumas

- **CSP** — `next.config.ts` definuoja script/img/connect/frame šaltinius; `'unsafe-eval'` įjungiamas tik `NODE_ENV=development` (Turbopack HMR).
- **HSTS** — `max-age=63072000; includeSubDomains; preload`.
- **Rate limiting** — `src/lib/rate-limit.ts` + `rate_limits` lentelė (B2B forma, kontaktai, newsletter).
- **Sanitizacija** — `sanitize-html` blog'o turiniui prieš render'inimą.
- **Service role key** — naudojamas TIK `src/lib/supabase/server.ts` ir admin route'uose. Niekada nesiunčiamas į klientą.
- **RLS policies** — `Public read products` filtruoja `is_active = true`; užsakymams — `user_id = auth.uid()`.

---

## 8. Testai

```bash
npm run test:e2e              # Playwright headless
npm run test:e2e:ui           # UI mode
npm run test:e2e:headed       # matomas browser'is
```

Padengta: smoke (home, katalogas, produkto puslapis), auth (login flow), analytics (GA4/Meta eventų emisija). Testai tikisi, kad dev serveris jau paleistas arba paleidžia jį automatiškai per `playwright.config.ts`.

---

## 9. Build & deploy

### Vercel (production)

Automatinis deploy iš `master` branch'o. Environment Variables (Vercel dashboard):

| Kintamasis | Scope |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Production |
| `NEXT_PUBLIC_SITE_URL` | Production |
| `RESEND_API_KEY` | Production |
| `PAYSERA_PROJECT_ID`, `PAYSERA_SIGN_PASSWORD` | Production |
| `SENTRY_AUTH_TOKEN` | Production (build only) |
| `META_CAPI_ACCESS_TOKEN` | Production |

### Svarbūs build pastebėjimai

- `@react-pdf/renderer` pažymėtas `serverExternalPackages` — naudoja Node API, negalima bundle'inti.
- `experimental.serverActions.bodySizeLimit = '12mb'` — produktų nuotraukos gali siekti 10MB.
- `experimental.globalNotFound = true` — reikalingas dėl kelių root layout'ų (`(admin)` + `(site)/[lang]`).
- Root layout'e ⚠️ **niekada nekviesti cookies/auth** — užkerta statinį renderingą (žr. `feedback_root_layout_dynamic_signals.md`).

---

## 10. Turinio ir verslo konvencijos

Detalios taisyklės — [../CLAUDE.md](../CLAUDE.md). Trumpai:

- **Kreipinys:** „Jūs" (ne „tu")
- **Tonas:** profesionalui, ne vartotojui
- **Visada akcentuoti:** 180 ml talpa
- **Spalvos:** magenta `#E91E8C` (pirminis CTA), mėlyna `#2B35AF` (antrinis)
- **Kategorijos:** Plaukų dažai (Color SHOCK) / Oksidantai / Šampūnai / Pagalbinės priemonės
- **Oksidantai (po migracijos 023):** 1.5% (5 VOL), 3% (10 VOL), 6% (20 VOL, featured), 9% (30 VOL)

---

## 11. Naudingos vietos kode

| Ką ieškote | Kur | Failas |
| --- | --- | --- |
| Produktų užklausos | `getProducts`, `getProductBySlug` | [src/lib/data/queries.ts](src/lib/data/queries.ts) |
| Krepšelio state | Zustand store | [src/lib/commerce/cart-store.ts](src/lib/commerce/cart-store.ts) |
| Užsakymo kūrimas | `createOrder` server action | [src/lib/commerce/order-actions.ts](src/lib/commerce/order-actions.ts) |
| Paysera signavimas | request builder | [src/lib/commerce/paysera.ts](src/lib/commerce/paysera.ts) |
| Email šablonai | Resend HTML | [src/lib/email/templates.ts](src/lib/email/templates.ts) |
| Sąskaitos PDF | React-PDF | [src/lib/invoices/](src/lib/invoices/) |
| JSON-LD schema | Product / Org / FAQ | [src/lib/schema.ts](src/lib/schema.ts) |
| Meta CAPI | server events | [src/lib/analytics-capi.ts](src/lib/analytics-capi.ts) |
| Locale middleware | detection + redirect | [src/proxy.ts](src/proxy.ts) |
| CSP / headers | security | [next.config.ts](next.config.ts) |
| Admin auth guard | session check | [src/lib/admin/auth.ts](src/lib/admin/auth.ts) |

---

## 12. Žinomi ribojimai / ateities darbai

- Lojalumo programa — schema paruošta (`discounts` + `user_profiles`), UI dar nerealizuotas.
- Stripe integracija — raktai environment'e rezervuoti, implementacija dar nepradėta (Paysera — pagrindinis LT).
- Platforma pasirinkta: Next.js + Supabase + Vercel (CLAUDE.md mini „Tilda / Shopify / WordPress pasirinkimas nepadarytas" — sprendimas padarytas naudos Next.js).
- Testų padengimas — tik smoke + auth + analytics; produktų / checkout E2E vertėtų pridėti.

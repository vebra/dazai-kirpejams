# Setup gidas — www.dazaikirpejams.lt

Šis gidas padeda nuo nulio paruošti projektą su Supabase ir produktų nuotraukomis.

Kol Supabase nesukonfigūruotas, svetainė veikia su mock duomenimis iš `src/lib/data/mock-products.ts` — gali kurti lokaliai be DB.

---

## 1. Supabase projekto sukūrimas

1. Eiti į https://supabase.com ir sukurti naują projektą.
2. Pasirinkti regioną: **Frankfurt (eu-central-1)** — artimiausias Lietuvai.
3. Išsaugoti **DB password** (reikės tik SQL konsolei).
4. Palaukti, kol projektas bus paruoštas (~2 min).

## 2. API raktų paėmimas

Supabase Studio → **Project Settings → API**:

- `Project URL` → kopijuoti į `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → kopijuoti į `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → kopijuoti į `SUPABASE_SERVICE_ROLE_KEY` (SLAPTAS — niekada nenaudoti kliento kode)

Atnaujinti `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 3. Migracijų paleidimas

Supabase Studio → **SQL Editor** → **New query**, nukopijuoti ir paleisti kiekvieną failą iš eilės:

1. `supabase/migrations/001_initial_schema.sql` — lentelės, enum'ai, indeksai, RLS policy'ai.
2. `supabase/migrations/002_seed_data.sql` — pradiniai brand'ai, kategorijos, keli produktai.
3. `supabase/migrations/003_storage_buckets.sql` — `products` ir `blog` Storage bucket'ai.

## 4. Pilnas produktų duomenų įkėlimas

Vietoje rankinio SQL rašymo naudojame Node scriptą, kuris paima mock duomenis ir upsert'ina juos į Supabase:

```bash
npm run db:seed
```

Scriptas:
- įrašo 4 kategorijas, 2 brand'us
- upsert'ina visus ~32 produktus (dažai, oksidantai, šampūnai, priemonės)
- saugu paleisti kelis kartus (idempotentiška pagal `slug`)

## 5. Produktų nuotraukų įkėlimas

Supabase Studio → **Storage → products** bucket.

Struktūra:
```
products/
  dazai/
    color-shock-1-0.webp
    color-shock-1-0-2.webp   ← papildomos nuotraukos
    color-shock-4-0.webp
    ...
  oksidantai/
    oxidant-3.webp
    ...
```

### Nuotraukų rekomendacijos:
- **Formatas:** WebP (geriausias kokybės/dydžio santykis)
- **Dydis:** 1200×1200 px (produktams), 1:1 santykis
- **Svoris:** iki 300 KB per failą
- **Fonas:** baltas arba neutralus
- Galima įkelti ir JPG / PNG — bucket'as palaiko visus formatus.

Įkėlus failus, atnaujinti produktų `image_urls` lauką Studio Table Editor arba per SQL:

```sql
update products
set image_urls = array[
  'https://xxxxx.supabase.co/storage/v1/object/public/products/dazai/color-shock-1-0.webp',
  'https://xxxxx.supabase.co/storage/v1/object/public/products/dazai/color-shock-1-0-2.webp'
]
where slug = 'color-shock-1-0';
```

Viešas Storage URL gaunamas per Studio (`Copy URL` ant failo).

## 6. Svetainės paleidimas

```bash
npm run dev
```

Atidarius `http://localhost:3000`:
- jei Supabase sukonfigūruotas, produktai tempiami iš DB
- jei nesukonfigūruotas, naudojami mock duomenys (tiek pat produktų)

Patikrinti duomenų šaltinį iš `src/lib/data/queries.ts` → `getDataSourceInfo()` grąžina `'supabase'` arba `'mock'`.

## 7. Build produkcijai

```bash
npm run build
```

Build generuoja visus statinius puslapius (~149) pagal `generateStaticParams`. Produkcinėje aplinkoje Vercel automatiškai naudos `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` iš Vercel Environment Variables.

## 8. Vercel deploy (ateityje)

Vercel dashboard → **Project Settings → Environment Variables**, pridėti:

| Kintamasis                       | Scope           |
| -------------------------------- | --------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY`      | Production      |
| `NEXT_PUBLIC_SITE_URL`           | Production (`https://www.dazaikirpejams.lt`) |
| `STRIPE_SECRET_KEY`              | Production (kai bus) |
| `PAYSERA_PROJECT_ID`             | Production (kai bus) |

## Dažniausi klausimai

**Produktai nerodomi po seed?**
- Patikrinti RLS policy'ą `Public read products` — turi būti `is_active = true`.
- Mock produktai turi `is_active: true`, tad seed'intų DB turėtų užtekti.

**Paveikslėliai neįsikrauna?**
- Patikrinti, ar bucket yra `public: true`.
- Patikrinti `next.config.ts` — `remotePatterns` automatiškai priima Supabase host'ą iš `NEXT_PUBLIC_SUPABASE_URL`.
- Patikrinti, ar `image_urls` DB lauke yra pilni URL'ai (ne tik failų pavadinimai).

**Noriu grįžti prie mock duomenų?**
- Ištrinti arba pakeisti `.env.local` vertes į placeholder'ius (`your-supabase-url`).
- Svetainė automatiškai pereis prie mock duomenų.

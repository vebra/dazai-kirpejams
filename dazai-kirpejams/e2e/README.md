# E2E Testai (Playwright)

## Paleidimas lokaliai

```bash
# Visi testai (background dev serveris startuoja automatiškai)
npm run test:e2e

# UI mode — interaktyvus, matai kas vyksta naršyklėje
npm run test:e2e:ui

# Headed mode — testai paleidžiami matomoje naršyklėje
npm run test:e2e:headed

# HTML report po failo (atidaroma po test run'o automatiškai)
npm run test:e2e:report
```

## Test struktūra

- `smoke.spec.ts` — bazinis "ar svetainė apskritai veikia" patikrinimas
- `auth.spec.ts` — login + verification + logout flow

## Test vartotojai

Auth testams reikia šių aplinkos kintamųjų `.env.test`:

```
E2E_TEST_USER_EMAIL=test-approved@dazaikirpejams.lt
E2E_TEST_USER_PASSWORD=...
```

Šis vartotojas turi būti **patvirtintas** (verification_status='approved') Supabase'e.
Sukurti per admin panelę arba SQL'u:

```sql
update user_profiles
set verification_status = 'approved', verified_at = now()
where id = (select id from auth.users where email = 'test-approved@dazaikirpejams.lt');
```

## CI

Vercel deploy preliminarus build'as sustoja, jei test'ai krenta.
Konfigūracija: `.github/workflows/e2e.yml`.

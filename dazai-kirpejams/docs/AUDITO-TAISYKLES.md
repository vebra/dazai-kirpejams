# Audito taisyklės

Kaip daryti svetainės / kodo auditą, kad radiniai būtų patikimi, o ne pilni
klaidingų teiginių. Šis dokumentas paduodamas kaip **įvestis** kiekvienam
auditui (žmogui ar AI agentui).

> **Realistiškas tikslas:** ne „100 % teisingi teiginiai" (neįmanoma — dalis
> radinių yra nuomonės, o verifikatorius irgi gali klysti), o **kad kiekvienas
> teiginys turėtų įrodymą ir pasitikėjimo lygį**. Naudingas auditas sako, kuriuo
> radiniu galima pasitikėti, o kurį dar reikia patikrinti — o ne pateikia viską
> kaip 100 % tiesą.

---

## 1. Procesas: radėjas → verifikatorius → ataskaita

Auditas visada dviejų fazių, niekada vienos:

1. **Radimo fazė.** Agentai/žmogus randa įtariamus radinius (plati aprėptis).
2. **Adversarinė patikros fazė.** Kiekvienas radinys perduodamas *kitam*
   patikrinimui, kurio užduotis — **PANEIGTI** teiginį, perskaičius **VISĄ**
   susijusį failą (ne ištrauką). Praeina tik tie, kurie išgyvena paneigimą.
3. **Ataskaita.** Tik patvirtinti radiniai, kiekvienas su įrodymu ir
   pasitikėjimo lygiu. Nuomonės pažymimos atskirai.

> Šitas žingsnis nėra pasirinktinis. 2026-07 audite ~pusė „P1/P2" radinių buvo
> klaidingi būtent todėl, kad jų niekas nepaneigė prieš pateikiant.

---

## 2. Kiekvienas radinys turi turėti įrodymą

Radinys be šių 4 dalykų — **neteikiamas**:

| Laukas | Ką reiškia |
|--------|-----------|
| `failas:eilutė` | Tiksli vieta |
| Pacituotas kodas | Realus kodas iš tos vietos (ne perpasakojimas) |
| Kodėl tai problema | Atsekimas / kelias / repro žingsniai |
| Pasitikėjimo lygis | `patvirtinta` / `įtariama` / `nuomonė` (žr. žemiau) |

### Pasitikėjimo lygiai

- **`patvirtinta`** — perskaitytas visas failas ir/arba paleistas įrankis
  (`build`, `tsc`, testas), kuris patvirtina. Galima taisyti iškart.
- **`įtariama`** — logika atrodo bloga, bet nepatikrintas visas kelias.
  Reikia rankinės patikros prieš taisant.
- **`nuomonė`** — vertinimas be objektyvaus teisingo atsakymo
  (dizainas, „per daug/mažai", stiliaus pasirinkimai). Sprendžia savininkas.

---

## 3. Paleisk įrankius — tai pigus filtras

Daug „bug'ų" yra spėjimai, kuriuos įrankiai iškart paneigia arba patvirtina:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # next build — pagauna renderinimo/tipų klaidas
npm run lint
npm test            # vitest
```

Prieš teigiant „šis kodas lūžta / netipizuotas / neveikia" — paleisk atitinkamą
įrankį. Jei teiginys neišlaiko `build`/`tsc` — jis krenta.

---

## 4. Tinkamas įrankis darbui

- **Ištraukų skaitymas** (pvz. `Explore` agentas) tinka **rasti** kodą, bet
  **negalima** juo patvirtinti radinio — jis mato tik ištraukas ir spėja iš
  konteksto. Patikrai — visada pilnas failo skaitymas.
- Runtime elgesys ≠ statinis kodas. UX/našumo/edge-case teiginius patvirtina tik
  paleista svetainė su realiais duomenimis, ne kodo skaitymas.

---

## 5. Kaip atskirti tyčinį sprendimą nuo bug'o

„Tyčinis sprendimas" ≠ „kodas taip veikia". Prieš dedant ką nors į „NEKABINTI"
sąrašą (6 skyrius), pritaikyk **3 klausimų testą**:

1. **Ar yra priežastis, kodėl taip padaryta?** (ne „kaip", o „kodėl")
2. **Ar kompromisas buvo pasirinktas žinant?** (žinota, ką prarandi, ir vis tiek pasirinkta)
3. **Kas tą priežastį patvirtina?** (turi būti šaltinis, ne prielaida)

- Visi trys TAIP → **tyčinis sprendimas** → į „NEKABINTI".
- Priežasties nėra, niekas nepasirinko, „tiesiog taip išėjo" → **bug'as** → taisyti.

> **Svarbu:** „neradau priežasties" ≠ „priežasties nėra". Jei šaltinio nėra —
> tai NĖRA tyčinis sprendimas, kol savininkas jo nepatvirtina.

### Kur ieškoti priežasties (patvirtinimo šaltiniai)

| Šaltinis | Ką reiškia |
|----------|-----------|
| Komentaras kode su „tyčia / nes / kad" | Techninis sprendimas užfiksuotas |
| Testas, tvirtinantis tą elgesį | Elgesys sąmoningai apsaugotas |
| Memory / dokumentacija | Anksčiau patvirtintas sprendimas |
| Savininko patvirtinimas | Verslo/dizaino intencija — tik jis gali pasakyti |

### Kas ką sprendžia

- **Techninius** (cache, noindex, buferiai) — patvirtina kodo komentaras/testas
  arba atsekimas. Gali eiti į „NEKABINTI" be savininko, jei priežastis dokumentuota.
- **Verslo / dizaino** (kainos svečiui, spalvos, „ar rodyti X") — **tik savininkas**.
  Auditas atneša klausimą, ne sprendimą. NEDĖTI į „NEKABINTI" be jo patvirtinimo.

### Kaip pateikti abejotiną radinį

Kiekvienam abejotinam radiniui atsakyk 2 klausimus atvirai:

> **Radau:** kaina svečiui nerodoma produkto puslapyje.
> **Ar tyčia?** Kode komentaras „tyčia, kad GSC nekabintų" + memory patvirtina → tyčinis, į „NEKABINTI".
> **Reikia savininko?** Ne — techninė priežastis dokumentuota.

> **Radau:** Comparison gradientas magenta→magenta.
> **Ar tyčia?** Priežasties kode/memory nėra → negaliu spręsti.
> **Reikia savininko?** Taip — dizaino pasirinkimas. Klausimas: palikti ar keisti?

---

## 6. „NEKABINTI" — sąmoningi projekto sprendimai

Tai NĖRA klaidos. Auditas neturi jų flaginti (o jei flagina — tik su tvirtu
nauju įrodymu, kodėl ankstesnis sprendimas nebegalioja).

### Kainos ir produktai
- **Svečiui kaina nerodoma.** Kainos gating'inamos client-side
  (`useVerifiedUser`); Product JSON-LD svečiui **tyčia** be `offers`, kad GSC
  „Produktų fragmentai" nekabintų. Nepridėti fake offers/rating.
- **Kainos į HTML nepatenka** produkto/listingų puslapiuose — puslapis
  renderinamas kaip svečiui (statinis/ISR), profesionalas kainą pasiima
  naršyklėje per RPC. Tai tyčia (CDN cache + našumas).

### SEO / indeksavimas
- **Privatūs puslapiai jau `noindex`**: prisijungimas, registracija, paskyra,
  atstatyti-slaptazodi, naujas-slaptazodis, krepselis, apmokejimas,
  uzsakymas/[orderNumber]. Nereikia jiems hreflang/canonical.
- **Autoriaus puslapis jau turi** pilną `generateMetadata` su hreflang.
- **Renginiai tik LT** — EN/RU nukreipiami į LT canonical, tad renginio
  puslapiui hreflang alternates NEREIKIA (viena kalba).

### Našumas / kaštai
- **Sesijos refresh buferis proxy'je (5 min) — kaštų-optimalus.** Logika:
  refresh vyksta tik kai iki galiojimo liko ≤ buferis. **Didesnis** buferis =
  **daugiau** `getUser()` kvietimų = daugiau kaštų. Nekelti „našumui".
- **Sentry `tracesSampleRate: 0.02`** — jau sąmoningai sumažinta kaštams.
  Toliau mažinti reiškia prarasti stebėjimą, kurio prireikė per incidentus.
- **Renginių skaitikliai nėra N+1** — home rodo 1 renginį; `getEventSpotsTaken`
  cache'inamas per-slug (`unstable_cache`, revalidate 60).
- **El. laiškų klaidos jau reportuojamos** centriniame `sendEmail`
  (`Sentry.captureMessage/captureException`); B2B/kontaktų lead'ai įrašomi į DB
  prieš laišką, tad nedingsta. Ne „nutildyta".

### Kita
- **Migracijos taikomos rankiniu būdu** per Supabase Dashboard SQL Editor, ne
  CLI. Po naujos funkcijos — `NOTIFY pgrst, 'reload schema'` prieš deploy.
- **OG pagrindinė kortelė — statinis JPG** (ne dinaminis). ImageMagick Windows'e
  NĖRA; vaizdų procesingui — `sharp`.

### Patvirtinta 2026-07 audite
- **banner-stats be autentifikacijos — best-effort dizainas.** Validacija yra
  (KEY_RE + type whitelist + DB char_length check), komentaras kode dokumentuoja:
  „sufalsinti load'ai sugadintų statistiką, ne duomenis". Neflaginti kaip
  saugumo skylės; galima siūlyti tik retention/WAF higieną.
- **`getCompanyInfo` fallback į tuščius rekvizitus — tyčia.** Komentaras
  order-actions.ts dokumentuoja principą „checkout'as niekada neužstringa";
  tuščias vatCode → vatRate=0 yra sąmoningas graceful degradation. Likutinė
  pastaba tik dėl Sentry signalo nebuvimo.
- **`trackCalculatorUsed` dedup'intas per sesiją** (`dedupeOncePerSession`
  analytics.ts) — „nėra debounce" yra klaidingas radinys, event'as išeina 1×/sesiją.
- **deleteOrderAction visada atstato sandėlį** — UI tekstas prie mygtuko tai
  eksplicitiškai dokumentuoja („prekės automatiškai grąžinamos į sandėlį").
  Diskusinis tik delivered/shipped atvejis, ne pats atstatymas.

> Kai patvirtinamas naujas tyčinis sprendimas — jį reikia įrašyti čia, kad
> kitas auditas jo nekabintų.

---

## 7. Dažni klaidingų teiginių šablonai (iš 2026-07 audito)

Pavyzdžiai, ką reiškia „nepatikrinta prielaida":

- „Trūksta metadata/hreflang" — o puslapis jau turėjo (neperskaitytas visas failas).
- „180 ml žymė priklauso nuo nuotraukos" — o `{volume_ml === 180 && …}` yra
  nepriklausomas nuo `primaryImage` (neatsektas JSX).
- „Non-null assertion — bug" — o `onSale` guard'as toje pačioje išraiškoje
  garantuoja ne-null (neperskaityta pilna sąlyga).
- „Sesijos buferį kelti 5→30 min" — apversta logika (nesuprastas palyginimas).

Bendra pamoka: **neperskaičius viso kelio, teiginys yra spėjimas, ne radinys.**

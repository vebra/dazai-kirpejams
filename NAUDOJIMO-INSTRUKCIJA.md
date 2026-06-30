# Svetainės www.dazaikirpejams.lt naudojimo instrukcija

Atnaujinta: 2026-06-12

Instrukcija padalinta į tris dalis pagal naudotojo vaidmenį:

1. **[Pirkėjui](#1-dalis-pirkėjui-viešoji-svetainė)** — viešoji svetainė, registracija, pirkimas
2. **[Vadybininkei](#2-dalis-vadybininkei-vadybininke)** — užsakymų pateikimas, klientai, atsargos
3. **[Administratorei](#3-dalis-administratorei-admin)** — užsakymų, sandėlio, kainų ir turinio valdymas

---

# 1 DALIS. PIRKĖJUI (viešoji svetainė)

## 1.1. Svetainės struktūra

Pagrindinis meniu (viršuje): **Produktai · Spalvų paletė · Salonams · Blogas · Apie mus · Kontaktai**. Dešinėje — kalbos jungiklis (LT / EN / RU), paskyros mygtukas ir krepšelis.

Pagrindiniai puslapiai:

| Puslapis | Adresas | Paskirtis |
|---|---|---|
| Pradžia | `/` | Hero, kategorijos, populiariausi produktai, B2B kvietimas |
| Produktai | `/produktai` | Visas katalogas su filtrais |
| Spalvų paletė | `/spalvu-palete` | Color SHOCK spalvų naršyklė pagal toną/numerį |
| Kainų skaičiuoklė | `/skaiciuokle` | 180 ml ekonominės naudos palyginimas su konkurentais |
| Salonams (B2B) | `/salonams` | B2B užklausos forma individualiam pasiūlymui |
| Renginiai | `/renginys` | Mokymai ir renginiai su registracija |
| Atsisiuntimai | `/atsisiuntimai` | Katalogai, instrukcijos ir kiti failai |
| DUK | `/duk` | Dažni klausimai |
| Pristatymas | `/pristatymas` | Pristatymo ir grąžinimo sąlygos |
| Kontaktai | `/kontaktai` | Kontaktų forma |

## 1.2. Kainų matomumas — svarbiausia taisyklė

**Kainos rodomos tik prisijungusiems ir administratorės patvirtintiems profesionalams.** Neprisijungęs lankytojas mato produktus, spalvas ir aprašymus, bet ne kainas. Tai sąmoningas sprendimas — parduotuvė skirta tik specialistams.

## 1.3. Registracija ir patvirtinimas

1. Spauskite paskyros ikoną → **Registracija** (`/registracija`).
2. Užpildykite privalomus laukus: el. paštas, slaptažodis, vardas, pavardė, telefonas, miestas, salono pavadinimas ir **verslo tipas** (Kirpėjas / Salono savininkas / Kita).
3. Neprivaloma: įmonės kodas, PVM kodas, dažų sunaudojimas per dieną, pastabos.
4. Patvirtinkite el. paštą per gautą laišką.
5. Palaukite administratorės patvirtinimo (žadama per ~30 min. darbo metu). Profesionalumą patvirtinantį dokumentą (PNG/JPG/WEBP/PDF) galima įkelti vėliau paskyroje.
6. Patvirtinus paskyrą matysite kainas ir galėsite pirkti.

Pamiršus slaptažodį: **Prisijungimas** → „Pamiršote slaptažodį?" (`/atstatyti-slaptazodi`) — gausite laišką su nuoroda naujam slaptažodžiui susikurti.

## 1.4. Pirkimas

1. **Susiraskite prekę** — per katalogą (filtrai: kategorija, spalva/tonas, kaina), spalvų paletę arba paiešką.
2. **Į krepšelį** — pasirinkite kiekį ir spauskite „Į krepšelį". Krepšelis pasiekiamas viršuje (`/krepselis`).
3. **Apmokėjimas** (`/apmokejimas`):
   - Kontaktai: vardas, pavardė, el. paštas, telefonas.
   - **Pristatymo būdas**: kurjeris / Omniva paštomatas (pasirenkamas iš sąrašo) / atsiėmimas vietoje.
   - Perkant įmonės vardu pažymėkite „Perku įmonės vardu" — atsiras salono pavadinimo, įmonės kodo ir PVM kodo laukai (reikalinga PVM sąskaitai faktūrai).
   - Turint **nuolaidos kodą** — įveskite jį tam skirtame lauke.
   - Galioja **minimali užsakymo suma** ir **nemokamo pristatymo riba** (aktualios sumos rodomos krepšelyje; jas nustato administratorė).
4. **Mokėjimas** — banko pavedimas: po užsakymo gausite el. laišką su banko rekvizitais ir užsakymo numeriu (jį nurodykite mokėjimo paskirtyje).
5. **Po užsakymo** — būsite nukreipti į užsakymo peržiūros puslapį `/uzsakymas/[numeris]`. Ta pati nuoroda ateina el. laišku — ji veikia be prisijungimo (apsaugota saugiu žetonu).

## 1.5. Paskyra (`/paskyra`)

Prisijungęs klientas mato:

- **Profilio būseną** — laukia patvirtinimo / patvirtinta / atmesta (su priežastimi).
- **Profilio duomenis ir redagavimą** — kontaktai, salonas, el. laiškų kalba (LT/EN/RU).
- **Dokumento įkėlimą** — jei paskyra dar nepatvirtinta.
- **Užsakymų istoriją** — visi užsakymai su būsenomis ir peržiūros nuorodomis.
- **Sąskaitas faktūras** — PVM sąskaitų atsisiuntimas PDF formatu.

**Užsakymo būsenos**, kurias mato klientas: Naujas → Apmokėtas → Ruošiamas → Išsiųstas → Pristatytas. Apie apmokėjimą, išsiuntimą (su siuntos sekimo numeriu) ir pristatymą klientas informuojamas el. laiškais automatiškai. Gavęs siuntą klientas gali pats paspausti **„Siunta gauta"** užsakymo peržiūros puslapyje.

---

# 2 DALIS. VADYBININKEI (`/vadybininke`)

Prisijungimas: `/vadybininke/login` (atskira paskyra, kurią sukuria administratorė skiltyje **Admin → Vadybininkės**).

Meniu: **Skydelis · Naujas užsakymas · Klientai · Mano užsakymai · Mano atsargos**.

## 2.1. Skydelis

Mėnesio statistika: patvirtinti pardavimai, laukiantys patvirtinimo, patvirtinta iš viso, klientų skaičius. Greitos nuorodos į kitus puslapius.

## 2.2. Naujas užsakymas

1. Pasirinkite klientą iš savo klientų sąrašo.
2. Sudėkite prekes (kainos pagal kliento kainų grupę, kurią nustato administratorė).
3. Pasirinkite pristatymo būdą.
4. Pateikite užsakymą — jis keliauja **administratorės patvirtinimui** (vadybininkė pinigų nepriima per sistemą).
5. Seną užsakymą galima **pakartoti** vienu mygtuku iš užsakymo peržiūros.

## 2.3. Klientai

Jūsų priskirtų klientų (salonų, kirpėjų) sąrašas su jų kainų grupėmis. Klientus priskiria administratorė.

## 2.4. Mano užsakymai

Visi jūsų pateikti užsakymai su būsenomis: **laukia patvirtinimo / patvirtinta / atmesta** (atmetimo atveju matoma priežastis). Kiekvieną galima atsidaryti ir peržiūrėti detaliai.

## 2.5. Mano atsargos (konsignacija)

Prekės, kurias administratorė jums išdavė iš sandėlio prekiauti tiesiogiai: sąrašas su kiekiais ir paskutinio išdavimo data. Išdavimą ir grąžinimą fiksuoja administratorė sandėlio skiltyje — jūsų atsargos atsinaujina automatiškai. Pardavimas iš jūsų atsargų nurašomas pateikiant užsakymą.

---

# 3 DALIS. ADMINISTRATOREI (`/admin`)

Prisijungimas: `/admin/login`. Administratores valdo skiltis **Nustatymai → Administratoriai**.

Šoninis meniu: **Apžvalga · Užsakymai · Patvirtinimai · Vadybininkės · Sandėlis · Klientai · Kainos ir nuolaidos · Didmeninės kainos · Nustatymai · Ataskaitos · Blogas · Baneriai · Atsisiuntimai · B2B užklausos · Renginiai · Verifikacija · Naujienlaiškiai · Kampanijos**.

## 3.1. Apžvalga

Pagrindinis skydelis su naujausiais užsakymais ir svarbiausia statistika. Nuo čia patogu pradėti dieną.

## 3.2. Užsakymai

Visų užsakymų sąrašas su paieška, filtrais ir CSV eksportu. Atsidarius užsakymą:

- **Būsenos keitimas**: Naujas (pending) → Apmokėtas (paid) → Ruošiamas (processing) → Išsiųstas (shipped) → Pristatytas (delivered); taip pat Atšauktas / Grąžintas. Keičiant būseną klientui **automatiškai** išsiunčiamas atitinkamas el. laiškas (apmokėta / išsiųsta / pristatyta / atšaukta). Mokėjimo būsena sinchronizuojasi su užsakymo būsena automatiškai.
- **Siuntos sekimas**: įveskite sekimo numerį ir kurjerį (Omniva, DPD, LP Express, Kita) — numeris pateks į „išsiųsta" laišką.
- **Prekės**: sąrašo peržiūra, galimybė pridėti prekių jau pateiktam užsakymui.
- **Mokėjimas**: būdas (pavedimas, Paysera, kortelė, grynais, terminalas) ir mokėjimo būsena.
- **PVM sąskaita faktūra**: generuojama automatiškai arba rankiniu būdu, atsisiunčiama PDF, prireikus regeneruojama.
- **Vidinės pastabos** — matomos tik administracijai.
- **Pavojinga zona**: užsakymo ištrynimas (prekės grąžinamos į sandėlio likutį).

**Naujas užsakymas ranka** (`Užsakymai → Naujas`): užsakymo sukūrimas telefonu/vietoje pirkusiam klientui — su prekių skenavimu, kliento parinkimu ir peržiūra prieš pateikiant.

## 3.3. Patvirtinimai

Vadybininkių pateikti užsakymai, laukiantys jūsų sprendimo: patvirtinti arba atmesti (su priežastimi, kurią matys vadybininkė).

## 3.4. Vadybininkės

Vadybininkių paskyrų kūrimas ir valdymas, klientų priskyrimas, jų veiklos peržiūra.

## 3.5. Sandėlis

Pagrindinė lentelė: visi produktai su likučiais, greitas likučio redagavimas, maržos % skaičiavimas (pagal savikainą ir kainą su 21 % PVM), masinis aktyvavimas/deaktyvavimas, paieška ir filtrai, CSV eksportas, spausdinimo vaizdas. **Naujas produktas** kuriamas mygtuku „+ Naujas".

Daugumoje sandėlio operacijų veikia **brūkšninio kodo skeneris** — nuskenuota prekė randama pagal EAN.

| Įrankis | Paskirtis |
|---|---|
| 📥 Priėmimas | Atvežtų prekių pajamavimas skenuojant, nurodant tiekėją |
| ➖ Nurašymas | Likučio mažinimas (brokas, pavyzdžiai) su priežastimi |
| 📋 Žurnalas | Visų sandėlio judėjimų istorija (priėmimai, pardavimai, nurašymai, išdavimai vadybininkei ir kt.) |
| 🔢 Revizija | Faktinio likučio skaičiavimas skenuojant; rodo neatitikimus ir leidžia juos patvirtinti. Istorija — atskirame puslapyje |
| 💇 Savo naudojimui | Prekių, paimtų savo saloniniam darbui, fiksavimas + ataskaita |
| 📦 Ką užsakyti | Perspėjimo ribos kiekvienai prekei; krentant likučiui žemiau ribos siunčiamas įspėjimo laiškas; generuojamas tiekėjo užsakymo lapas |
| 🚚 Išdavimas vadybininkei | Prekių išdavimas konsignacijai su spausdinamu išdavimo lapu |
| ↩ Grąžinimas | Prekių priėmimas atgal iš vadybininkės |
| 📄 Išduotos prekės | Kas, kiek ir kokių prekių šiuo metu turi |
| 📊 Suderinimas | Faktinio ir apskaitinio likučio palyginimas |

## 3.6. Klientai

Visų užsiregistravusių klientų sąrašas; atsidarius klientą — jo profilis, užsakymų istorija, dokumentai.

## 3.7. Kainos ir nuolaidos

- **Nuolaidų kodai (kuponai)** — procentinė arba fiksuota nuolaida; galima riboti kategorijai ar konkrečioms prekėms.
- **Akcijos** — sumažinta kaina visoms prekėms, kategorijai arba išrinktoms prekėms.
- **Pristatymas ir krepšelis** — kurjerio, paštomato, atsiėmimo kainos, nemokamo pristatymo riba, minimali užsakymo suma. **Čia yra vienintelė tikroji pristatymo kainų valdymo vieta** (svetainė ima reikšmes iš čia).
- **Masinis kainų atnaujinimas** — procentinis ar fiksuotas pokytis visai kategorijai.

## 3.8. Didmeninės kainos

Kainų grupės B2B/didmenos klientams ir vadybininkių klientams.

## 3.9. Nustatymai

- **Įmonės rekvizitai** — pavadinimas, adresas, telefonas (naudojami laiškuose ir sąskaitose).
- **Banko duomenys** — sąskaita ir bankas (rodomi checkout patvirtinimo laiške ir sąskaitose).
- **Sąskaitos šablonas** — brendas, šūkis, spalva, standartinės pastabos.
- **Administratoriai** — admin teisių suteikimas/atėmimas (tik jau užsiregistravusiems naudotojams).

## 3.10. Ataskaitos

Pardavimų ir veiklos ataskaitos, įskaitant vadybininkių pardavimus.

## 3.11. Verifikacija

Naujų registracijų patvirtinimas — **kritinis kasdienis darbas**, nes nepatvirtinti klientai nemato kainų:

1. Apie naują registraciją su dokumentu gaunate el. laišką.
2. Skiltyje **Verifikacija** peržiūrite duomenis ir dokumentą.
3. **Patvirtinate** (klientas gauna laišką ir pradeda matyti kainas) arba **atmetate** su priežastimi.
4. `Verifikacija → Naujas` — galite patys sukurti ir iškart patvirtinti klientą (pvz., telefonu).

## 3.12. Turinys ir rinkodara

- **Blogas** — straipsnių kūrimas ir redagavimas (LT/EN/RU). *Pastaba: gyvas turinys redaguojamas čia, ne kode.*
- **Baneriai** — pagrindinio puslapio banerių valdymas su rodymo būsenomis, statistika ir automatine artėjančio renginio juosta.
- **Atsisiuntimai** — failų (katalogų, instrukcijų) įkėlimas viešam puslapiui `/atsisiuntimai`.
- **B2B užklausos** — iš `/salonams` formos atėjusios užklausos.
- **Renginiai** — renginių kūrimas, registracijų sąrašas, dalyvių sąrašo spausdinimas.
- **Naujienlaiškiai** — prenumeratorių sąrašas.
- **Kampanijos** — el. pašto kampanijos: gavėjų parinkimas, juodraščiai, klonavimas, atidarymų statistika, siuntimų žurnalas.

---

# Priedas. Dažniausi darbo scenarijai

**Klientas skambina: „Nematau kainų"**
→ Patikrinkite **Admin → Verifikacija** / **Klientai** — ar paskyra patvirtinta. Jei klientas naudoja telefoną — paprašykite atsijungti ir prisijungti iš naujo.

**Gautas pavedimas už užsakymą**
→ **Admin → Užsakymai** → atidarykite užsakymą → būsena „Apmokėtas". Klientas automatiškai gaus patvirtinimo laišką.

**Siunta išsiųsta**
→ Užsakyme įveskite sekimo numerį ir kurjerį → būsena „Išsiųstas". Klientas gaus laišką su sekimo nuoroda.

**Atvažiavo prekės iš tiekėjo**
→ **Admin → Sandėlis → Priėmimas** → skenuokite prekes, nurodykite tiekėją ir kiekius.

**Vadybininkė važiuoja pas klientus**
→ **Sandėlis → Išdavimas vadybininkei** → sudarykite sąrašą, atspausdinkite lapą. Grįžus — **Grąžinimas**.

**Norite akcijos savaitgaliui**
→ **Admin → Kainos ir nuolaidos → Akcijos** (sumažinta kaina) arba sukurkite nuolaidos kodą kampanijai.

**Mažėja populiarios prekės likutis**
→ **Sandėlis → Ką užsakyti** — nustatykite ribą; pasiekus ją gausite laišką ir galėsite išspausdinti tiekėjo užsakymo lapą.

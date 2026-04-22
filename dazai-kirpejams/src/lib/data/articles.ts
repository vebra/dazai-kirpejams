/**
 * Blog straipsnių duomenys.
 *
 * Pastaba: kol kas statinis sąrašas — vėliau galima perkelti į Supabase
 * (pvz. `articles` lentelė). Struktūra atkartoja straipsnis.html dizainą:
 * kategorija, data, skaitymo laikas, body blokai ir susiję straipsniai.
 */

export type ArticleCategory = 'patarimai' | 'produktai' | 'tendencijos'

export type ArticleBlock =
  | { type: 'p'; html: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'blockquote'; html: string }
  | {
      type: 'table'
      headers: string[]
      rows: string[][]
    }

export type Article = {
  slug: string
  category: ArticleCategory
  categoryLabel: string
  icon: string
  title: string
  excerpt: string
  date: string
  readingMinutes: number
  body: ArticleBlock[]
  relatedSlugs?: string[]
}

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  patarimai: 'Patarimai',
  produktai: 'Produktai',
  tendencijos: 'Tendencijos',
}

/**
 * Spalvų klasės straipsnių tag'ams (bg + text) — naudojamos ir sąraše,
 * ir detaliame puslapyje, kad būtų vienodai.
 */
export const CATEGORY_STYLES: Record<ArticleCategory, string> = {
  patarimai: 'bg-brand-magenta/10 text-brand-magenta',
  produktai: 'bg-brand-blue/10 text-brand-blue',
  tendencijos: 'bg-[#F5A623]/10 text-[#B07400]',
}

export const articles: Article[] = [
  {
    slug: 'kaip-pasirinkti-oksidanta',
    category: 'patarimai',
    categoryLabel: 'Patarimai',
    icon: '⚗',
    title: 'Kaip pasirinkti tinkamą oksidantą',
    excerpt:
      'Tinkamas oksidantas — pagrindas kokybiškam dažymo rezultatui. Sužinokite, kaip parinkti koncentraciją pagal norimą efektą ir plaukų būklę.',
    date: '2026-03-28',
    readingMinutes: 6,
    relatedSlugs: ['180ml-vs-60ml', 'dazymo-technikos'],
    body: [
      {
        type: 'p',
        html: 'Oksidanto koncentracija lemia, ar dažai tik dengia, ar šviesina plaukus. Neteisingas pasirinkimas — tai nenuspėjamas rezultatas, sausi plaukai ir nepatenkintas klientas. Šiame straipsnyje apžvelgsime, kada naudoti 1.5%, 3%, 6% ir 9% oksidantą bei kaip pasirinkti tinkamą koncentraciją pagal klientės plaukų būklę.',
      },
      { type: 'h2', text: '1.5% oksidantas (5 VOL)' },
      {
        type: 'p',
        html: 'Silpniausia koncentracija, skirta <strong>švelniam toninimui be šviesinimo efekto</strong>. Naudokite, kai dirbate su demi-permanent tonais, norite atnaujinti spalvą arba suminkštinti atspalvį be jokio plaukų struktūros poveikio.',
      },
      { type: 'h2', text: '3% oksidantas (10 VOL)' },
      {
        type: 'p',
        html: 'Švelni koncentracija, skirta <strong>toninimui ir spalvos atnaujinimui</strong>. Naudokite, kai norite atgaivinti jau dažytus plaukus, sustiprinti atspalvį arba uždengti pavienius žilus plaukus be šviesinimo efekto.',
      },
      { type: 'h2', text: '6% oksidantas (20 VOL)' },
      {
        type: 'p',
        html: 'Universali koncentracija. Tinka <strong>standartiniam dažymui tonu į toną</strong>, žilų plaukų dengimui ir plaukų pašviesinimui 1–2 tonais. Tai dažniausiai naudojamas oksidantas salone.',
      },
      { type: 'h2', text: '9% oksidantas (30 VOL)' },
      {
        type: 'p',
        html: 'Stipriausia mūsų linijos koncentracija, skirta <strong>plaukų šviesinimui 2–3 tonais</strong>. Svarbu: kuo stipresnis oksidantas, tuo daugiau dėmesio plaukų būklei — visada įvertinkite porosity ir elastingumą prieš procedūrą.',
      },
      { type: 'h2', text: 'Praktinės rekomendacijos' },
      {
        type: 'ul',
        items: [
          'Visada atlikite sruogelės testą prieš pirmą dažymą',
          'Naudokite proporcijas pagal gamintojo nurodymus (Color SHOCK — 1:2)',
          'Nenaudokite seno, atidaryto oksidanto — jis praranda aktyvumą',
          'Saugokite oksidantą tamsioje, vėsioje vietoje',
        ],
      },
      {
        type: 'p',
        html: 'Teisingas oksidanto pasirinkimas — tai ne tik dažymo rezultatas, bet ir klientės plaukų sveikata ilgalaikėje perspektyvoje.',
      },
    ],
  },
  {
    slug: '180ml-vs-60ml',
    category: 'produktai',
    categoryLabel: 'Produktai',
    icon: '📊',
    title: '180 ml vs 60 ml: kuo skiriasi?',
    excerpt:
      'Didesnė pakuotė — ne tik daugiau produkto. Palyginome kainas, naudojimo efektyvumą ir praktišką naudą kasdieniam darbui salone.',
    date: '2026-03-15',
    readingMinutes: 5,
    relatedSlugs: ['kaip-pasirinkti-oksidanta', 'sumazinti-sanaudas'],
    body: [
      {
        type: 'p',
        html: 'Profesionaliam kirpėjui ar koloristui dažų pakuotės dydis yra ne estetinis, o ekonominis klausimas. Kiekviena papildoma pakuotė, kurią atidarote per dieną, — tai papildomos išlaidos, papildomos atliekos ir papildomas laikas užsakymams tvarkyti. Šiame straipsnyje palyginsime standartinę 60 ml ir Color SHOCK 180 ml pakuotes — skaičiais, faktais ir praktiniu požiūriu.',
      },
      { type: 'h2', text: 'Standartinė 60 ml pakuotė' },
      {
        type: 'p',
        html: 'Dauguma profesionalių plaukų dažų gamintojų Europoje siūlo 60 ml tūbio formato pakuotes. Tai ilgametis rinkos standartas, prie kurio įpratusi dauguma specialistų. Vieno dažymo metu vidutiniškai sunaudojama 60–80 ml dažų mišinio (dažai + oksidantas), o tai reiškia, kad viena pakuotė dažnai išnaudojama per vieną procedūrą.',
      },
      {
        type: 'p',
        html: 'Salonams, kurie aptarnauja keliolika klienčių kasdien, tai reiškia didelį pakuočių kiekį per mėnesį. Kiekviena pakuotė — tai ir kaina, ir logistika, ir atliekos. Be to, ne visada tiksliai sunaudojamas visas tūris: dažnai tūbio dugne lieka 5–10 ml produkto, kurio nebeįmanoma panaudoti.',
      },
      { type: 'h2', text: 'Color SHOCK 180 ml pranašumas' },
      {
        type: 'p',
        html: 'Color SHOCK profesionalūs plaukų dažai pateikiami <strong>180 ml pakuotėse</strong> — tai triskart didesnė talpa nei rinkos standartas. Šis sprendimas buvo sukurtas būtent profesionalams, dirbantiems intensyviai ir kasdien.',
      },
      { type: 'p', html: 'Didesnė pakuotė suteikia keletą svarbių pranašumų:' },
      {
        type: 'ul',
        items: [
          '<strong>Mažesnė kaina per ml</strong> — didesnė talpa leidžia taikyti ekonomiškesnę kainodarą',
          '<strong>Mažiau atliekų</strong> — viena pakuotė atstoja tris standartines, tai reiškia tris kartus mažiau atliekų',
          '<strong>Patogesnis naudojimas</strong> — rečiau reikia keisti tūbius darbo metu',
          '<strong>Paprastesnė logistika</strong> — mažiau pakuočių užsakyti, saugoti ir tvarkyti',
          '<strong>Mažiau iššvaistyto produkto</strong> — procentaliai mažiau dažų lieka tūbio dugne',
        ],
      },
      { type: 'h2', text: 'Palyginimo lentelė' },
      {
        type: 'p',
        html: 'Pažiūrėkime konkrečius skaičius, lyginant standartinę 60 ml pakuotę su Color SHOCK 180 ml:',
      },
      {
        type: 'table',
        headers: [
          'Parametras',
          'Standartiniai dažai (60 ml)',
          'Color SHOCK (180 ml)',
        ],
        rows: [
          ['Talpa', '60 ml', '180 ml'],
          ['Kaina', '~5,00 €', '7,90 €'],
          ['Kaina per ml', '~0,083 €/ml', '0,044 €/ml'],
          ['Pakuočių per mėnesį (80 dažymų)', '~80 vnt.', '~27 vnt.'],
          ['Atliekos per mėnesį', '80 tūbių', '27 tūbiai'],
        ],
      },
      {
        type: 'blockquote',
        html: 'Kaina per ml — tai objektyviausias būdas palyginti dažų vertę. Color SHOCK 180 ml pakuotėje vienas mililitras kainuoja beveik dvigubai pigiau nei standartiniuose dažuose.',
      },
      { type: 'h2', text: 'Ekonominis skaičiavimas' },
      {
        type: 'p',
        html: 'Paimkime konkretų pavyzdį. Salonas atlieka <strong>20 dažymų per savaitę</strong> (4 dažymai per dieną, 5 darbo dienos). Kiekvienam dažymui vidutiniškai sunaudojama 60 ml dažų (be oksidanto).',
      },
      { type: 'h3', text: 'Su standartiniais 60 ml dažais:' },
      {
        type: 'ul',
        items: [
          'Per savaitę: 20 pakuočių × 5,00 € = <strong>100,00 €</strong>',
          'Per mėnesį: 80 pakuočių × 5,00 € = <strong>400,00 €</strong>',
          'Per metus: 960 pakuočių × 5,00 € = <strong>4 800,00 €</strong>',
        ],
      },
      { type: 'h3', text: 'Su Color SHOCK 180 ml:' },
      {
        type: 'ul',
        items: [
          'Per savaitę: ~7 pakuotės × 7,90 € = <strong>55,30 €</strong>',
          'Per mėnesį: ~27 pakuotės × 7,90 € = <strong>213,30 €</strong>',
          'Per metus: ~320 pakuočių × 7,90 € = <strong>2 528,00 €</strong>',
        ],
      },
      {
        type: 'blockquote',
        html: 'Metinis sutaupymas — daugiau nei <strong>2 200 €</strong>. Tai reikšminga suma, kurią galima investuoti į salono plėtrą, naują įrangą ar darbuotojų mokymus.',
      },
      { type: 'h2', text: 'Praktinė nauda kasdien' },
      {
        type: 'p',
        html: 'Ekonominis aspektas — svarbus, tačiau ne vienintelis. Kasdieniam darbui salone 180 ml pakuotė suteikia ir kitokios praktinės naudos, apie kurią kolegos dažnai nekalba.',
      },
      {
        type: 'p',
        html: '<strong>Mažiau užsakymų.</strong> Užuot užsakę 80 tūbių per mėnesį, užsakysite 27. Tai mažiau laiko, skirto užsakymų formavimui, priėmimui ir sandėliavimui.',
      },
      {
        type: 'p',
        html: '<strong>Kompaktiškesnis sandėliavimas.</strong> 27 tūbiai užima žymiai mažiau vietos nei 80. Salono darbo erdvė lieka tvarkinga ir laisva.',
      },
      {
        type: 'p',
        html: '<strong>Mažiau atliekų.</strong> Mažiau pakuočių — mažiau plastiko atliekų. Jei Jūsų salonui svarbus tvarumo aspektas, tai konkretus žingsnis ta linkme.',
      },
      {
        type: 'p',
        html: '<strong>Patogesnis darbas.</strong> Viena 180 ml pakuotė gali būti naudojama keliems dažymams iš eilės, todėl nereikia nuolat atsukti naujų tūbių. Darbo procesas tampa sklandesnis ir greitesnis.',
      },
      { type: 'h2', text: 'Išvada' },
      {
        type: 'p',
        html: 'Pakuotės dydis — tai ne smulkmena. Tai sprendimas, kuris kasdien veikia Jūsų salono pelningumą, darbo patogumus ir išlaidų kontrolę. Color SHOCK 180 ml pakuotė sukurta būtent tam — suteikti profesionalui daugiau produkto, mažesne kaina per ml, su mažiau rūpesčių dėl logistikos ir atliekų.',
      },
    ],
  },
  {
    slug: 'dazymo-technikos',
    category: 'patarimai',
    categoryLabel: 'Patarimai',
    icon: '✍',
    title: 'Dažymo technikos profesionalams',
    excerpt:
      'Balayage, ombré, sluočių technika — apžvelgiame populiariausias dažymo technikas ir patariame, kaip pasiekti geriausius rezultatus.',
    date: '2026-02-20',
    readingMinutes: 7,
    relatedSlugs: ['kaip-pasirinkti-oksidanta', 'spalvu-tendencijos-2026'],
    body: [
      {
        type: 'p',
        html: 'Moderni kolorizacija nebėra vien tik „vienos spalvos" dažymas. Klientės vis dažniau ateina su konkrečiomis idėjomis iš socialinių tinklų — balayage, ombré, money piece, foilayage. Šiame straipsnyje apžvelgsime populiariausias technikas ir duosime praktinių patarimų, kaip jas atlikti profesionaliai.',
      },
      { type: 'h2', text: 'Balayage' },
      {
        type: 'p',
        html: 'Prancūziškos kilmės technika, kuri 2010-aisiais tapo nauju „aukso standartu". Dažai tepami ranka, be folijos, sukuriant natūralius saulės nudažyto efekto perėjimus. Tinka beveik visiems plaukų tipams, ypač tiems, kas nori mažiau priežiūros reikalaujančio rezultato.',
      },
      { type: 'h2', text: 'Ombré ir Sombré' },
      {
        type: 'p',
        html: 'Aiškus perėjimas nuo tamsių šaknų į šviesius galus. <strong>Sombré</strong> — švelnesnė, subtilesnė ombré versija. Rinkitės sombré klientėms, kurios nori pokyčio, bet ne pernelyg drastiško.',
      },
      { type: 'h2', text: 'Foilayage' },
      {
        type: 'p',
        html: 'Hibridinė technika — balayage rezultatas, bet su folijos pagalba gaunamas intensyvesnis šviesinimas. Tinka tamsiaplaukėms, kurios nori ryškaus balayage efekto.',
      },
      { type: 'h2', text: 'Money Piece' },
      {
        type: 'p',
        html: 'Ryškiai pašviesintos pavienės sruogos veido linijoje. Greita procedūra, didelis vizualinis efektas. Puiki parinktis tarp dviejų didelių dažymų.',
      },
      { type: 'h2', text: 'Ką rinktis kiekvienam atvejui' },
      {
        type: 'ul',
        items: [
          'Natūraliam efektui su minimaliu priežiūros kiekiu — <strong>balayage</strong>',
          'Ryškiam kontrastui — <strong>ombré</strong> arba <strong>foilayage</strong>',
          'Greitam pokyčiui tarp dažymų — <strong>money piece</strong>',
          'Pirmam sprendimui apie šviesinimą — <strong>sombré</strong>',
        ],
      },
    ],
  },
  {
    slug: 'spalvu-tendencijos-2026',
    category: 'tendencijos',
    categoryLabel: 'Tendencijos',
    icon: '✨',
    title: 'Spalvų tendencijos 2026 metams',
    excerpt:
      'Kokie atspalviai dominuos šį sezoną? Apžvelgiame populiariausius tonus ir pateikiame Color SHOCK spalvų rekomendacijas Jūsų klientams.',
    date: '2026-01-30',
    readingMinutes: 5,
    relatedSlugs: ['dazymo-technikos', '180ml-vs-60ml'],
    body: [
      {
        type: 'p',
        html: '2026-ieji grįžta prie natūralumo, bet su charakteriu. Tendencijos, kurias matome tarptautinėse grožio savaitėse, rodo aiškią kryptį: <strong>šilti, sodrūs, „rudeniški" tonai</strong> ir sluoksniuotas kolorizavimas, kuris pabrėžia plaukų tekstūrą.',
      },
      { type: 'h2', text: '1. Expensive Brunette' },
      {
        type: 'p',
        html: 'Giliai ruda bazė su šiltais karamelės ir medaus atšvaitais. Tai ne tamsu, tai <em>brangu</em>. Idealu darbinėms moterims, kurios nori ambicingos, bet profesionalios išvaizdos.',
      },
      { type: 'h2', text: '2. Copper Glow' },
      {
        type: 'p',
        html: 'Varinis atspalvis tampa vyraujančia ryškia spalva. Nuo subtilaus variaraudonio iki ryškaus pumpkin spice — klientės vis drąsiau renkasi šiltus, ugningus tonus.',
      },
      { type: 'h2', text: '3. Cool Vanilla Blonde' },
      {
        type: 'p',
        html: 'Klasikinio šalto blondo evoliucija — su vanilės, smėlio ir pieno perlo atšvaitais. Mažiau balta, daugiau sodraus šiltumo.',
      },
      { type: 'h2', text: '4. Chocolate Cherry' },
      {
        type: 'p',
        html: 'Šokoladinio rudo ir tamsios vyšnios fuzija. Tinka klientėms, kurios ieško drąsos, bet nenori atsitraukti nuo natūralaus tono.',
      },
      {
        type: 'p',
        html: 'Visos šios tendencijos lengvai pasiekiamos su Color SHOCK paletės 4, 5, 6, 7 ir 8 eilučių atspalviais. Svarbiausia — teisingas oksidantas ir tinkama ekspozicijos trukmė.',
      },
    ],
  },
  {
    slug: 'sumazinti-sanaudas',
    category: 'produktai',
    categoryLabel: 'Produktai',
    icon: '📈',
    title: 'Kaip sumažinti dažų sąnaudas salone',
    excerpt:
      'Praktiški patarimai, kaip optimizuoti dažų naudojimą ir sumažinti išlaidas neprarandant dažymo kokybės. Skaičiuojame realų sutaupymą.',
    date: '2026-01-12',
    readingMinutes: 6,
    relatedSlugs: ['180ml-vs-60ml', 'kaip-pasirinkti-oksidanta'],
    body: [
      {
        type: 'p',
        html: 'Dažų sąnaudos — dažniausiai antra pagal dydį salono kintamosios išlaidos po nuomos. Net nedidelis jų optimizavimas per metus gali duoti keturženklį sutaupymą. Šiame straipsnyje — konkretūs žingsniai, kaip sumažinti sąnaudas nepakenkiant kokybei.',
      },
      { type: 'h2', text: '1. Tikslus dažų svėrimas' },
      {
        type: 'p',
        html: 'Svarstyklės kainuoja 15–30 €, o grąžą duoda nuo pirmos savaitės. Vietoj „nuo akies" išspaudimo iš tūbio — tikslus 30, 45, 60 g pasvėrimas. Rezultatas: nebelieka „per daug išmaišyto" mišinio, kuris keliauja į šiukšliadėžę.',
      },
      { type: 'h2', text: '2. Didesnė pakuotė = mažesnė kaina per ml' },
      {
        type: 'p',
        html: 'Kaip jau nagrinėjome <a href="/lt/blogas/180ml-vs-60ml" style="color: var(--magenta); font-weight: 600;">ankstesniame straipsnyje</a>, 180 ml pakuotėje kaina per ml yra beveik dvigubai mažesnė nei 60 ml standartinėse. Jei kol kas nesate perėję — apsiskaičiuokite metinį sutaupymą skaičiuoklėje.',
      },
      { type: 'h2', text: '3. Standartizuoti protokolai pagal plaukų ilgį' },
      {
        type: 'p',
        html: 'Sukurkite vidinį dokumentą: <strong>trumpi plaukai — 30 g, vidutiniai — 45 g, ilgi — 60–80 g</strong>. Kai visa komanda dirba vienodais matavimais, sąnaudos tampa prognozuojamos ir suveikia efekto masto taupymas perkant didmena.',
      },
      { type: 'h2', text: '4. Sandėlio rotacija FIFO principu' },
      {
        type: 'p',
        html: 'First In, First Out — pirma atvežti tūbiai naudojami pirmi. Taip išvengiate nurašymo dėl pasibaigusio galiojimo. Paženklinkite pakuotes atvežimo data.',
      },
      { type: 'h2', text: '5. Derinkite procedūras' },
      {
        type: 'p',
        html: 'Jei per dieną numatyti du panašaus tono dažymai — sumaišykite šiek tiek didesnį mišinį ir atlikite abi procedūras iš eilės. Sutaupysite ir dažų, ir laiko.',
      },
      { type: 'h2', text: 'Tikėtinas rezultatas' },
      {
        type: 'p',
        html: 'Taikant šiuos 5 principus, vidutinis salonas gali sumažinti dažų sąnaudas <strong>15–25%</strong> per pirmus 3 mėnesius. Jei dabar per mėnesį dažams išleidžiate 400 €, tai yra 60–100 € kas mėnesį, arba 720–1 200 € per metus.',
      },
    ],
  },
  {
    slug: 'prieziura-po-dazymo',
    category: 'patarimai',
    categoryLabel: 'Patarimai',
    icon: '💧',
    title: 'Plaukų priežiūra po dažymo',
    excerpt:
      'Ką rekomenduoti klientui po dažymo? Aptariame efektyvias priežiūros priemones ir patarimus, kurie pailgina spalvos išsilaikymą.',
    date: '2025-12-18',
    readingMinutes: 5,
    relatedSlugs: ['kaip-pasirinkti-oksidanta', 'dazymo-technikos'],
    body: [
      {
        type: 'p',
        html: 'Dažymas baigiasi ne tuomet, kai klientė išeina iš salono — tuomet prasideda svarbiausia fazė: pirmos 72 valandos. Ką rekomenduoti klientei, kad spalva išsilaikytų ilgiau, o plaukai liktų sveiki?',
      },
      { type: 'h2', text: 'Pirmos 72 valandos' },
      {
        type: 'ul',
        items: [
          'Neplauti plaukų 48–72 val. po dažymo — spalvos molekulės dar „fiksuojasi"',
          'Vengti karšto vandens — šiltas arba drungnas geriausia',
          'Nenaudoti lygintuvo aukštoje temperatūroje',
          'Saugoti plaukus nuo tiesioginių saulės spindulių',
        ],
      },
      { type: 'h2', text: 'Kasdienis priežiūros protokolas' },
      {
        type: 'p',
        html: 'Rekomenduokite klientei <strong>sulfatų ir silikonų neturintį šampūną</strong>, skirtą dažytiems plaukams. Sulfatai išplauna spalvą per kelis plovimus, o silikonai neleidžia kaukei prasiskverbti į plauko struktūrą.',
      },
      { type: 'h2', text: 'Giluminė priežiūra' },
      {
        type: 'p',
        html: 'Bent kartą per savaitę — maitinanti kaukė 10–20 minučių. Kaukės, kuriose yra argano aliejaus, keratino ir panthenolio, atstato plauko struktūrą ir padeda spalvai išlikti.',
      },
      { type: 'h2', text: 'Kas 4–6 savaites — salone' },
      {
        type: 'p',
        html: 'Glosas arba tonerio procedūra pailgina spalvos gyvavimą. Tai 20 minučių procedūra, kurios dėka spalva grįžta į pradinį intensyvumą, o klientė jaučia, kad salonas rūpinasi rezultatu ilgalaikiu laikotarpiu — ne tik vieną dieną.',
      },
    ],
  },
]

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}

export function getRelatedArticles(article: Article): Article[] {
  if (!article.relatedSlugs?.length) return []
  return article.relatedSlugs
    .map((slug) => articles.find((a) => a.slug === slug))
    .filter((a): a is Article => Boolean(a))
}

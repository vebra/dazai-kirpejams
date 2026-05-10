/**
 * Kategorijos puslapių SSR turinys (400+ žodžių per kategoriją per kalbą).
 *
 * Tikslas — Google'iui suteikti pakankamai unikalaus E-E-A-T turinio
 * kiekvienoje kategorijoje (dažai, oksidantai, šampūnai, priemonės),
 * kad puslapiai rikiuotųsi ne tik dėl produktų grid'o, bet ir dėl
 * profesionalui naudingos informacijos: spalvų teorija, naudojimo
 * gidai, oksidantų pasirinkimas, žilumos dengimas, pristatymo logika.
 *
 * Struktūra: kiekviena kategorija turi `intro` (lead pastraipa) ir
 * `sections` masyvą (h2 + body), tinka rich text rendering'ui.
 */

export type SeoSection = {
  heading: string
  body: string
}

export type CategorySeo = {
  intro: string
  sections: SeoSection[]
}

type Locale = 'lt' | 'en' | 'ru'

export const categorySeoContent: Record<string, Record<Locale, CategorySeo>> = {
  // ============================================
  // DAŽAI — Hair Dyes
  // ============================================
  dazai: {
    lt: {
      intro:
        'Color SHOCK profesionalūs plaukų dažai sukurti kasdieniam darbui salone — su gilia 50+ atspalvių paletė ir 180 ml pakuote, kuri tris kartus didesnė už standartinę rinkos talpą. Stabili kreminė formulė su Argano ir Jojoba aliejais užtikrina prognozuojamą rezultatą, švelniai dengia žilus plaukus ir išlaiko sodrią spalvą iki kito dažymo.',
      sections: [
        {
          heading: 'Kodėl koloristai renkasi 180 ml pakuotę',
          body: 'Salono ekonomika prasideda nuo savikainos. Standartinė 60 ml pakuotė vidutinio ilgio plaukams baigiasi pusiaukelėje, todėl koloristas priverstas atplėšti antrą tūbelę ir prarasti likutį po dažymo. 180 ml pakuotės užtenka iki dviejų pilnų dažymų vienai klientei, o pakuotės savikaina vienam ml yra 30–40% mažesnė nei rinkos vidurkis. Mažiau atliekų, mažiau užsakymų ir prognozuojamas mėnesinis biudžetas — tai trys konkretūs argumentai, kodėl B2B klientai pereina prie didesnio formato.',
        },
        {
          heading: 'Kaip suprasti atspalvio numerį',
          body: 'Color SHOCK paletė remiasi tarptautine numeracijos sistema. Pirmas skaičius prieš tašką žymi bazinį šviesumo lygį — 1 yra tamsiausia juoda, 12 — kraštutinis šviesinimas. Po taško einantys skaičiai rodo refleksinį atspalvį: .0 — natūralus be reflekso, .1 — pelenų (šaltas), .2 — violetinis, .3 — auksinis, .5 — raudonmedžio, .6 — raudonas, .8 — šokoladinis. Pavyzdžiui, 9.3 yra labai šviesi blondinė su auksiniu refleksu, o 7.1 — vidutinė pelenų blondinė šaltam toninimui. Patarimas: atspalvio formulę pradėkite nuo natūralaus toną įvertinimo (kliento bazinis lygis), tada pridėkite norimą refleksą.',
        },
        {
          heading: 'Oksidanto koncentracijos pasirinkimas',
          body: '6% (20 VOL) — universalus salono pasirinkimas standartiniam dažymui ir pilnam žilų plaukų dengimui; tai dažniausiai užsakomas variantas. 9% (30 VOL) reikalingas, kai šviesinama 2–3 tonais arba dirbama su intensyviomis SUPERLIFT spalvomis. 3% (10 VOL) — toninimui ir spalvos atnaujinimui ant jau dažytų plaukų be papildomo šviesinimo. 1.5% (5 VOL) — minimaliam efektui, jautresnei galvos odai arba pasteliniam toninimui. Visi keturi koncentracijos variantai prieinami tame pačiame asortimente.',
        },
        {
          heading: 'Žilumos dengimas ir korekcijos',
          body: 'NATURAL serija (.0) yra pagrindas pilnam žilumos dengimui — ji turi pilną pigmentinį padengimą be antrinio reflekso. Naudojant SUPERLIFT (12.x) ar bet kokią refleksinę spalvą ant plaukų, kuriuose virš 50% žilų, būtina į mišinį pridėti 30–50% natūralaus toną tame pačiame lygyje. ASH (.1) ir ASH PEARL (.12) atspalviai padeda neutralizuoti geltonumą po pirminio šviesinimo arba balayage. VIOLET (.22) ir SUPERLIFT VIOLET (12.2) — kraštutinis sprendimas geltonumo naikinimui ant 9–10 lygio bazės.',
        },
        {
          heading: 'Pristatymas ir B2B sąlygos',
          body: 'Užsiregistravę profesionalai gauna prieigą prie pilnos paletės su patvirtintomis kainomis, individualų vadybininką ir kvietimus į gyvas dažymo prezentacijas Kaune. Salonai gali užsisakyti reguliarų mėnesinį tiekimą su prognozuojamomis kainomis ir pristatymu per 1–3 darbo dienas. Brokuotos prekės keičiamos nemokamai, neatidarytas grąžinimas — per 14 dienų. Mokėjimas: banko pavedimu, Paysera arba kortele.',
        },
      ],
    },
    en: {
      intro:
        'Color SHOCK professional hair dyes are formulated for daily salon work — a deep 50+ shade palette in a 180 ml tube, three times the volume of the standard market pack. The stable cream formula, enriched with Argan and Jojoba oils, delivers predictable results, gentle grey coverage and rich, long-lasting colour until the next service.',
      sections: [
        {
          heading: 'Why colourists choose the 180 ml format',
          body: 'Salon economics start with cost-per-service. A standard 60 ml tube usually runs out halfway through a mid-length application, forcing the colourist to open a second tube and waste whatever is left. A 180 ml tube covers up to two full applications for the same client, and the cost per millilitre is 30–40% lower than the market average. Less waste, fewer orders and a predictable monthly budget are the three concrete arguments behind the B2B switch to the larger format.',
        },
        {
          heading: 'How to read a shade number',
          body: 'The Color SHOCK palette follows the international numbering system. The first digit before the dot signals the base level — 1 is the deepest black, 12 is maximum lift. The digits after the dot describe the reflect: .0 natural, .1 ash (cool), .2 violet, .3 gold, .5 mahogany, .6 red, .8 chocolate. For example, 9.3 is a very light blonde with golden reflect, while 7.1 is a medium ash blonde for cool toning. Tip: build the formula starting from the client’s natural level, then layer the desired reflect on top.',
        },
        {
          heading: 'Choosing the developer concentration',
          body: '6% (20 VOL) is the universal salon pick for standard colouring and full grey coverage — it is the most-ordered concentration. 9% (30 VOL) is required when lifting 2–3 tones or working with intense SUPERLIFT shades. 3% (10 VOL) is used for toning and refreshing colour on previously dyed hair without further lifting. 1.5% (5 VOL) handles minimal-impact work, sensitive scalps and pastel toning. All four concentrations are available within the same range, so no need to source developers from multiple suppliers.',
        },
        {
          heading: 'Grey coverage and corrections',
          body: 'The NATURAL series (.0) is the base for full grey coverage — it carries full pigment payoff without a secondary reflect. When using SUPERLIFT (12.x) or any reflect shade on hair with more than 50% grey, blend in 30–50% of the natural tone at the same level. ASH (.1) and ASH PEARL (.12) shades help neutralise yellow after initial lifting or balayage. VIOLET (.22) and SUPERLIFT VIOLET (12.2) are the heavy-duty choice for killing yellow on a level 9–10 canvas.',
        },
        {
          heading: 'Delivery and B2B terms',
          body: 'Verified professionals get access to the full palette with confirmed pricing, a dedicated account manager and invitations to live demos in Kaunas. Salons can set up a recurring monthly supply schedule with locked-in pricing and 1–3 business-day delivery. Faulty goods are replaced free of charge; unopened products can be returned within 14 days. Payment: bank transfer, Paysera or card.',
        },
      ],
    },
    ru: {
      intro:
        'Профессиональные краски для волос Color SHOCK созданы для ежедневной работы в салоне — палитра из 50+ оттенков в упаковке 180 мл, в три раза превышающей стандартный размер. Стабильная кремовая формула с маслами арганы и жожобы обеспечивает предсказуемый результат, мягко закрашивает седину и сохраняет насыщенный цвет до следующего окрашивания.',
      sections: [
        {
          heading: 'Почему колористы выбирают формат 180 мл',
          body: 'Экономика салона начинается с себестоимости одной услуги. Стандартной упаковки 60 мл часто не хватает на средние волосы — приходится открывать вторую тубу и терять остаток. Упаковки 180 мл хватает на два полных окрашивания клиентки, а себестоимость одного миллилитра на 30–40% ниже среднерыночной. Меньше отходов, меньше заказов и предсказуемый месячный бюджет — три конкретных аргумента в пользу большого формата для B2B-клиентов.',
        },
        {
          heading: 'Как читать номер оттенка',
          body: 'Палитра Color SHOCK следует международной системе номеров. Первая цифра до точки — базовый уровень: 1 — самый тёмный чёрный, 12 — максимальное осветление. Цифры после точки указывают рефлекс: .0 натуральный, .1 пепельный (холодный), .2 фиолетовый, .3 золотистый, .5 махагон, .6 красный, .8 шоколадный. Например, 9.3 — очень светлый блонд с золотистым рефлексом, а 7.1 — средний пепельный блонд для холодного тонирования. Совет: формулу стройте от натурального уровня клиента, затем добавляйте желаемый рефлекс.',
        },
        {
          heading: 'Выбор концентрации оксиданта',
          body: '6% (20 VOL) — универсальный выбор салона для стандартного окрашивания и полного закрашивания седины; самая популярная концентрация. 9% (30 VOL) нужен при осветлении на 2–3 тона или для работы с интенсивными SUPERLIFT. 3% (10 VOL) — для тонирования и обновления цвета на уже окрашенных волосах без дополнительного осветления. 1.5% (5 VOL) — минимальное воздействие, чувствительная кожа головы или пастельное тонирование. Все четыре концентрации доступны в одной линейке.',
        },
        {
          heading: 'Закрашивание седины и коррекции',
          body: 'Серия NATURAL (.0) — основа для полного закрашивания седины: полный пигмент без вторичного рефлекса. При использовании SUPERLIFT (12.x) или любого рефлекса на волосах с более чем 50% седины добавьте в смесь 30–50% натурального тона того же уровня. ASH (.1) и ASH PEARL (.12) помогают нейтрализовать желтизну после первичного осветления или балаяжа. VIOLET (.22) и SUPERLIFT VIOLET (12.2) — тяжёлая артиллерия для уничтожения желтизны на уровне 9–10.',
        },
        {
          heading: 'Доставка и B2B-условия',
          body: 'Верифицированные профессионалы получают доступ к полной палитре с подтверждёнными ценами, персонального менеджера и приглашения на живые демонстрации в Каунасе. Салоны могут оформить регулярную ежемесячную поставку с фиксированной ценой и доставкой за 1–3 рабочих дня. Бракованный товар заменяется бесплатно, нераспечатанный возвращается в течение 14 дней. Оплата: банковский перевод, Paysera или карта.',
        },
      ],
    },
  },

  // ============================================
  // OKSIDANTAI — Oxidants
  // ============================================
  oksidantai: {
    lt: {
      intro:
        'Color SHOCK oksiduojantys emulsija — keturių koncentracijų linija (1.5%, 3%, 6%, 9% / 5–30 VOL), suderinta su visa Color SHOCK dažų palete. Stabilus pH 3.5, kreminė konsistencija lengvai maišosi 1:2 santykiu, jokio purslojimo darbinėje vietoje, nuolaisėjanti ant plaukų be tekėjimo.',
      sections: [
        {
          heading: 'Kuri koncentracija kuriam atvejui',
          body: '1.5% (5 VOL) — minimaliam toninimui ant tos pačios bazės arba pasteliniams atspalviams; nesuteikia šviesinimo efekto. 3% (10 VOL) — toninimui ir spalvos atnaujinimui ant jau dažytų plaukų; švelnus, beveik be paviršinio sluoksnio pažeidimo. 6% (20 VOL) — universalus salono variantas standartiniam dažymui ir 100% žilumos dengimui; suteikia 1–2 tonų pakelimą. 9% (30 VOL) — kai reikia šviesinti 2–3 tonais arba dirbti su SUPERLIFT (11.x, 12.x) refleksais.',
        },
        {
          heading: 'Maišymo santykis ir laikymo laikas',
          body: 'Su Color SHOCK dažais visada maišykite 1:2 — viena pakuotė dažų (180 ml) reikalauja 360 ml oksidanto. Standartinis laikymo laikas ant plaukų — 30–35 min. Su SUPERLIFT — iki 50 min. Žilumos dengimui — pilną 35 min. Maišykite ne anksčiau nei prieš 5 min iki aplikavimo, nes oksidacijos reakcija prasideda iškart po sumaišymo. Atidarytą butelį laikykite vertikaliai, sandariai uždarytą, 18–25°C temperatūroje.',
        },
        {
          heading: 'Stabilumas ir saugojimas',
          body: 'Stabili formulė be amoniako pertekliaus išlaiko aktyvią koncentraciją 36 mėnesius nuo gamybos datos. Po atidarymo rekomenduojama sunaudoti per 6 mėnesius — aktyvumas išlieka stabilus, bet pH gali pradėti kisti. Saugokite nuo tiesioginių saulės spindulių ir karščio (>30°C). Užšalimo ar atšildymo procesai negrįžtamai sugadina emulsiją — laikymas šaltose patalpose neleistinas.',
        },
        {
          heading: 'Saugumas ir kontraindikacijos',
          body: 'Privaloma alergijos testas 48 val prieš pirmą pacifikatos klientės dažymą. Naudokite vienkartines pirštines ir ventiliuojamą darbo vietą — vandenilio peroksidas yra dirgiklis akims ir kvėpavimo takams. Vengti kontakto su metalo įrankiais (geležies šaukštai/dubenys) — gali atsirasti nepageidaujamas oksidacijos efektas. Vaikams iki 16 metų — netaikoma. Nėštumo ir žindymo metu — konsultuokitės su gydytoju.',
        },
        {
          heading: 'Pakuotė ir vertė salonui',
          body: 'Vienas oksidanto litras (1000 ml) aptarnauja iki 5–6 pilnų dažymų vidutinio ilgio plaukams su 1:2 santykiu. Kai dirbate su Color SHOCK 180 ml dažais, vienos litro pakuotės užtenka maždaug tam pačiam laikotarpiui kaip ir 3 dažų pakuočių — patogus paralelinis užsakymas. Reguliarus B2B tiekimas užtikrina, kad oksidanto niekada nepritrūks intensyvią dieną.',
        },
      ],
    },
    en: {
      intro:
        'Color SHOCK developing emulsions — a four-concentration line (1.5%, 3%, 6%, 9% / 5–30 VOL) calibrated to work with the full Color SHOCK dye palette. Stable pH 3.5 and a creamy texture mix easily at a 1:2 ratio, no splatter on the bench, and the mix stays in place on hair without dripping.',
      sections: [
        {
          heading: 'Which concentration for which job',
          body: '1.5% (5 VOL) — minimal toning on the same base or pastel shades; no lifting. 3% (10 VOL) — toning and colour refresh on previously coloured hair; gentle, with almost no cuticle disturbance. 6% (20 VOL) — the universal salon pick for standard colouring and 100% grey coverage; delivers 1–2 levels of lift. 9% (30 VOL) — required when lifting 2–3 levels or working with SUPERLIFT (11.x, 12.x) reflects.',
        },
        {
          heading: 'Mixing ratio and processing time',
          body: 'Always mix 1:2 with Color SHOCK dyes — one 180 ml dye tube needs 360 ml of developer. Standard processing time on hair is 30–35 minutes. With SUPERLIFT — up to 50 minutes. For full grey coverage — the full 35 minutes. Mix no earlier than 5 minutes before application; the oxidation reaction starts immediately after blending. Store opened bottles upright, tightly sealed, at 18–25°C.',
        },
        {
          heading: 'Stability and storage',
          body: 'The stable formula, free of excess ammonia, holds its active concentration for 36 months from manufacture. Once opened, use within 6 months — the active level remains stable, but pH may drift after that. Keep away from direct sunlight and heat (>30°C). Freeze-thaw cycles permanently break the emulsion — cold storage is not permitted.',
        },
        {
          heading: 'Safety and contraindications',
          body: 'A 48-hour patch test is mandatory before colouring a new client for the first time. Use single-use gloves and a ventilated workspace — hydrogen peroxide is an eye and respiratory irritant. Avoid contact with metal tools (iron bowls or whisks), which can trigger unwanted oxidation. Not for children under 16. During pregnancy and breastfeeding — consult a physician.',
        },
        {
          heading: 'Pack size and salon value',
          body: 'A one-litre developer (1000 ml) covers roughly 5–6 full applications on mid-length hair at the 1:2 ratio. Paired with Color SHOCK 180 ml dyes, one developer matches the volume of about three dye tubes — a clean parallel order line. A recurring B2B subscription keeps developer stocked through the busiest weeks.',
        },
      ],
    },
    ru: {
      intro:
        'Окислительные эмульсии Color SHOCK — линия из четырёх концентраций (1.5%, 3%, 6%, 9% / 5–30 VOL), откалиброванная под полную палитру красок Color SHOCK. Стабильный pH 3.5, кремовая текстура легко смешивается в соотношении 1:2, без брызг и подтёков на волосах.',
      sections: [
        {
          heading: 'Какая концентрация для какой задачи',
          body: '1.5% (5 VOL) — минимальное тонирование на той же базе или пастельные оттенки; без эффекта осветления. 3% (10 VOL) — тонирование и обновление цвета на уже окрашенных волосах; деликатное воздействие, почти без раскрытия кутикулы. 6% (20 VOL) — универсальный выбор салона для стандартного окрашивания и 100% закрашивания седины; даёт 1–2 уровня подъёма. 9% (30 VOL) — нужен при осветлении на 2–3 уровня или работе с SUPERLIFT (11.x, 12.x).',
        },
        {
          heading: 'Соотношение смешивания и время выдержки',
          body: 'С красками Color SHOCK всегда смешивайте 1:2 — на одну тубу 180 мл нужно 360 мл оксиданта. Стандартное время выдержки на волосах — 30–35 минут. С SUPERLIFT — до 50 минут. Для полного закрашивания седины — полные 35 минут. Смешивайте не раньше чем за 5 минут до нанесения — реакция окисления начинается сразу после смешивания. Откупоренный флакон храните вертикально, плотно закрытым, при 18–25°C.',
        },
        {
          heading: 'Стабильность и хранение',
          body: 'Стабильная формула без избытка аммиака удерживает активную концентрацию 36 месяцев с даты производства. После вскрытия использовать в течение 6 месяцев — активность сохраняется, но pH может смещаться. Беречь от прямых солнечных лучей и тепла (>30°C). Циклы заморозки и оттаивания необратимо разрушают эмульсию — холодное хранение не допускается.',
        },
        {
          heading: 'Безопасность и противопоказания',
          body: 'Тест на аллергию за 48 часов обязателен перед первым окрашиванием новой клиентки. Используйте одноразовые перчатки и проветриваемое рабочее место — пероксид водорода раздражает глаза и дыхательные пути. Избегайте контакта с металлическими инструментами (железные миски, венчики) — может возникнуть нежелательная реакция. Детям до 16 лет — нельзя. При беременности и грудном вскармливании — проконсультируйтесь с врачом.',
        },
        {
          heading: 'Объём упаковки и ценность для салона',
          body: 'Одной упаковки оксиданта (1000 мл) хватает примерно на 5–6 полных окрашиваний на средние волосы при соотношении 1:2. В паре с красками Color SHOCK 180 мл это соответствует расходу примерно трёх туб краски — удобная параллельная заказная линия. Регулярная B2B-поставка гарантирует, что оксиданта не закончится в самые загруженные дни.',
        },
      ],
    },
  },

  // ============================================
  // ŠAMPŪNAI — Shampoos
  // ============================================
  sampunai: {
    lt: {
      intro:
        'Profesionalūs šampūnai dažytiems plaukams — formulės, sukurtos išlaikyti spalvos sodrumą tarp dažymų ir apsaugoti dažų pigmentą nuo greito išplovimo. Sulfatų lygis kontroliuojamas, pH 4.5–5.5 atitinka natūralų plaukų rūgštinį balansą.',
      sections: [
        {
          heading: 'Kodėl įprasti šampūnai naikina spalvą',
          body: 'Standartiniai prekybos centro šampūnai naudoja stiprius sulfatus (SLS, SLES) ir aukšto pH formules, kurie atveria plaukų kutikulę ir leidžia spalvos pigmentui ištekėti su kiekvienu plovimu. Po dažymo per pirmą savaitę galima prarasti iki 25% spalvos sodrumo. Color Protect linija naudoja švelnesnius paviršinius aktyviuosius medžiagas (coco-glucoside, decyl glucoside), kurie efektyviai valo, bet nesujudina spalvos pigmento.',
        },
        {
          heading: 'Naudojimo dažnis ir technika',
          body: 'Dažytiems plaukams optimalu plauti 2–3 kartus per savaitę su drungnu (ne karštu) vandeniu. Karštas vanduo papildomai atveria kutikulę ir greitina spalvos praradimą. Šampūną tepkite tik ant skalpo ir šaknų — ilgio gylis nusiplauna, kai šampūnas su vandeniu nutekės žemyn. Toks režimas išsaugo iki 80% spalvos po 6 savaičių (lyginant su 50% naudojant standartinį šampūną).',
        },
        {
          heading: 'Salono priežiūros ritualas',
          body: 'Po dažymo salone rekomenduokite klientams 48 val nesisplauti — kutikulei reikia laiko užsidaryti ir užfiksuoti pigmentą. Pirmas namų plovimas — su drungnu vandeniu ir Color Protect šampūnu. Po šampūno — kondicionierius su rūgštiniu pH (palmitamidopropyltrimonium chloride, behentrimonium methosulfate), kuris glaudžiai uždaro kutikulę. Salono klientas, kuris seka šitą ritualą, atkeliauja kitam dažymui su 30% mažesniu refleksinio toninimo poreikiu.',
        },
        {
          heading: 'Toninių šampūnų logika',
          body: 'Violetiniai/sidabriniai (purple, blue) toniniai šampūnai naudojami blondinėms — neutralizuoja geltonumą tarp dažymų. Naudoti 1 kartą per savaitę vietoj įprasto šampūno; palaikyti 3–5 min ant plaukų. Per dažnas naudojimas (kasdien) gali sukurti pernelyg šaltą, beveik violetinį atspalvį. Tamsioms blondinėms — kas 10 dienų; platinos blondinėms — kas savaitę.',
        },
        {
          heading: 'B2B asortimentas salonams',
          body: 'Profesionalūs šampūnai prieinami didelio formato (1L) talpose salonų darbo vietai, taip pat mažesnėse mažmeninėse pakuotėse, kurias galite parduoti klientams kaip „take-home" priežiūros papildymą. Tai papildomas pajamų šaltinis salonui — komisinis 30–40% nuo retail kainos.',
        },
      ],
    },
    en: {
      intro:
        'Professional shampoos for coloured hair — formulas designed to keep colour saturated between salon visits and protect dye pigment from rapid wash-out. Sulfate levels are controlled, and the pH of 4.5–5.5 matches the natural acidic balance of the hair shaft.',
      sections: [
        {
          heading: 'Why standard shampoos strip colour',
          body: 'Off-the-shelf supermarket shampoos rely on strong sulfates (SLS, SLES) and high-pH formulas that lift the cuticle and let dye pigment leak out with every wash. In the first week after colouring you can lose up to 25% of colour saturation. The Color Protect line uses gentler surfactants (coco-glucoside, decyl glucoside) that clean effectively without disturbing pigment.',
        },
        {
          heading: 'Frequency and technique',
          body: 'For coloured hair, 2–3 washes per week with lukewarm (not hot) water is optimal. Hot water further opens the cuticle and accelerates colour loss. Apply shampoo only to the scalp and roots — the length gets cleansed as the lather rinses down. With this routine, up to 80% of the colour is preserved after 6 weeks, versus around 50% on a standard shampoo.',
        },
        {
          heading: 'In-salon aftercare ritual',
          body: 'After a colour service, advise clients to skip washing for 48 hours so the cuticle can close and lock in the pigment. The first home wash uses lukewarm water and the Color Protect shampoo. Follow with an acidic-pH conditioner (palmitamidopropyltrimonium chloride, behentrimonium methosulfate) that seals the cuticle tight. Clients who follow this ritual return for their next colour with 30% less need for reflect toning.',
        },
        {
          heading: 'How tone-correcting shampoos work',
          body: 'Purple/silver (purple, blue) tone-correcting shampoos are used on blondes to neutralise yellow between services. Use once a week in place of regular shampoo; leave on for 3–5 minutes. Daily use can over-tone the hair to a near-violet cast. Dark blondes — every 10 days; platinum — weekly.',
        },
        {
          heading: 'B2B range for salons',
          body: 'Professional shampoos come in large 1L bottles for the salon backbar, plus smaller retail packs you can resell as a take-home maintenance product. This is an additional revenue stream — a 30–40% margin on retail pricing.',
        },
      ],
    },
    ru: {
      intro:
        'Профессиональные шампуни для окрашенных волос — формулы, созданные для сохранения насыщенности цвета между визитами в салон и защиты пигмента от быстрого вымывания. Уровень сульфатов контролируется, pH 4.5–5.5 соответствует естественному кислотному балансу волос.',
      sections: [
        {
          heading: 'Почему обычные шампуни уносят цвет',
          body: 'Стандартные шампуни из супермаркета используют сильные сульфаты (SLS, SLES) и формулы с высоким pH, которые раскрывают кутикулу и вымывают пигмент с каждым мытьём. За первую неделю после окрашивания можно потерять до 25% насыщенности цвета. Линия Color Protect использует мягкие ПАВы (coco-glucoside, decyl glucoside), которые эффективно очищают, не затрагивая пигмент.',
        },
        {
          heading: 'Частота и техника мытья',
          body: 'Для окрашенных волос оптимально 2–3 мытья в неделю тёплой (не горячей) водой. Горячая вода дополнительно раскрывает кутикулу и ускоряет потерю цвета. Шампунь наносите только на кожу головы и корни — длина очищается стекающей пеной. При таком режиме сохраняется до 80% цвета через 6 недель (против 50% при использовании обычного шампуня).',
        },
        {
          heading: 'Ритуал ухода после салона',
          body: 'После окрашивания в салоне рекомендуйте клиентам не мыть голову 48 часов — кутикула должна закрыться и зафиксировать пигмент. Первое домашнее мытьё — тёплой водой и шампунем Color Protect. После шампуня — кондиционер с кислотным pH (palmitamidopropyltrimonium chloride, behentrimonium methosulfate), плотно закрывающий кутикулу. Клиент, соблюдающий этот ритуал, приходит на следующее окрашивание с потребностью в рефлексном тонировании на 30% меньше.',
        },
        {
          heading: 'Как работают тонирующие шампуни',
          body: 'Фиолетовые/серебристые (purple, blue) тонирующие шампуни используются на блондах — нейтрализуют желтизну между окрашиваниями. Применять раз в неделю вместо обычного шампуня; выдержать 3–5 минут. Ежедневное использование может перетонировать волосы до фиолетового оттенка. Тёмный блонд — раз в 10 дней; платиновый — еженедельно.',
        },
        {
          heading: 'B2B-ассортимент для салонов',
          body: 'Профессиональные шампуни доступны в большой упаковке (1 л) для рабочей зоны салона и в меньших розничных флаконах для продажи клиентам как take-home продукт. Это дополнительный доход салона с маржой 30–40% от розничной цены.',
        },
      ],
    },
  },

  // ============================================
  // PRIEMONĖS — Accessories
  // ============================================
  priemones: {
    lt: {
      intro:
        'Profesionalios kirpėjų darbo priemonės — dažymo teptukai, maišymo dubenys, folijos, klijentų pelerinai ir higienos priemonės. Asortimentas surinktas iš salonų realiai naudojamų pagrindinių daiktų, vengiant „nice-to-have" pirkinių, kurie kabo lentynoje.',
      sections: [
        {
          heading: 'Dažymo teptukai — kaip pasirinkti',
          body: 'Plokščias 4–5 cm pločio teptukas yra universalus salono pasirinkimas — tinka tiek šaknims, tiek ilgio aplikacijoms. Siauras 2 cm teptukas reikalingas tiksliai šaknų kontūro aplikacijai ir foilių dažymui balayage technikose. Tikrų sintetinių šerelių teptukai (taklon, polyester) išlaiko formą po 200+ dažymų; pigūs nailoniniai pradeda lūžti po 30 dažymų. Plaukų galuose besikaupiantys dažai — ženklas, kad teptukas senas ir pernelyg storas.',
        },
        {
          heading: 'Maišymo dubenys ir mentelės',
          body: 'Plastikiniai (PE) dubenys yra standartas — chemiškai neutralūs su oksidantais. Metaliniai dubenys griežtai NEnaudojami: oksidacijos reakcija su geležimi sukuria nepageidaujamus refleksus mišinyje. Dubuo turi turėti tvirtą kairę pusę su pirštais kabinamais išmataris — paprasti glotnūs dubenys slidžia darbo metu. Mentelės — silikoninės lankstomos, kad tepalas išgrandyklas iš dubens galo, taupant produktą.',
        },
        {
          heading: 'Folijos ir aliuminio popieriaus alternatyvos',
          body: 'Standartinis 35×40 cm folijos lapas tinka vidutiniam ilgiui. Trumpiems plaukams — 25×30 cm. Profesionalios folijos (15 mikronų) lengvai sulanksto ir laiko šilumą — pagreitintas oksidacijos procesas leidžia kabinti 5 min trumpiau. Recyclable popieriaus alternatyvos (kraft paper, kompostuojami sluoksniai) tinka eko-pozicionuotiems salonams, bet kainuoja 2–3x daugiau ir mažiau efektyviai laiko šilumą.',
        },
        {
          heading: 'Klientų pelerinai ir apsauga',
          body: 'Vandeniui atspari (PU coated) pelerinė turi būti standartinė salono priemonė — apsaugo kliento drabužius nuo dažų ir oksidanto purslų. Plaunama 60°C su salono baltinimu 1×/savaitę. Vienkartinės popieriaus pelerinės — antstatas didesniems salonams su daug klientų per dieną. Apsauginės juostos kakliečiui — silikoninė sandari linija prie pakaušio neleidžia šaltam dažų mišiniui patekti ant kliento drabužių.',
        },
        {
          heading: 'Higienos priemonės',
          body: 'Vienkartinės nitrilo pirštinės (ne lateksinės) — standartas; lateksas gali sukelti alergiją tiek kirpėjui, tiek klientui. Paviršių dezinfekantai (etanolis 70% + chlorheksidinas) — kasdien valyti darbo vietą tarp klientų. Plaukų plovyklės dušelio antgalio dezinfekcija — kas savaitę pamerkti į citrinos rūgšties tirpalą, kad pašalinti kalcio nusėdimus.',
        },
      ],
    },
    en: {
      intro:
        'Professional hairdresser tools — colouring brushes, mixing bowls, foils, client capes and hygiene supplies. The range is curated from items salons actually use day to day, skipping the “nice-to-have” pieces that end up gathering dust on a shelf.',
      sections: [
        {
          heading: 'Colouring brushes — how to choose',
          body: 'A flat 4–5 cm wide brush is the universal salon pick — works for roots and length applications alike. A narrow 2 cm brush is needed for precise root-line work and balayage foil placement. Real synthetic-bristle brushes (taklon, polyester) hold shape past 200+ services; cheap nylon ones break down after 30. Dye build-up at the bristle tips is a sign the brush is old or too thick.',
        },
        {
          heading: 'Mixing bowls and spatulas',
          body: 'Plastic (PE) bowls are the standard — chemically neutral with developer. Metal bowls are strictly off-limits: the oxidation reaction with iron causes unwanted reflects in the mix. The bowl needs a sturdy left-side handle with finger grips — flat smooth bowls slip mid-application. Spatulas — flexible silicone, so the colour scrapes cleanly out of the bowl without wasting product.',
        },
        {
          heading: 'Foils and paper alternatives',
          body: 'A standard 35×40 cm foil sheet handles mid-length hair. Short hair — 25×30 cm. Professional foils (15 microns) fold easily and trap heat — the accelerated oxidation lets you take 5 minutes off the processing time. Recyclable paper alternatives (kraft paper, compostable sheets) suit eco-positioned salons, but cost 2–3× more and hold heat less effectively.',
        },
        {
          heading: 'Client capes and protection',
          body: 'A waterproof (PU-coated) cape should be standard kit — protects client clothing from dye and developer splatter. Machine wash at 60°C with salon bleach once a week. Disposable paper capes are an add-on for high-volume salons. Neck-line protection strips — a soft silicone seal at the nape stops cool dye mix from running onto the client’s clothing.',
        },
        {
          heading: 'Hygiene supplies',
          body: 'Single-use nitrile gloves (not latex) are the standard — latex can trigger allergies in both stylist and client. Surface disinfectants (70% ethanol + chlorhexidine) — clean the workstation daily between clients. Wash-bay nozzle hygiene — soak weekly in citric acid solution to dissolve calcium deposits.',
        },
      ],
    },
    ru: {
      intro:
        'Профессиональные инструменты парикмахеров — кисти для окрашивания, миски для смешивания, фольга, пеньюары и средства гигиены. Ассортимент собран из позиций, которые салоны реально используют каждый день, без «nice-to-have» предметов, пылящихся на полке.',
      sections: [
        {
          heading: 'Кисти для окрашивания — как выбрать',
          body: 'Плоская кисть шириной 4–5 см — универсальный салонный выбор для корней и длины. Узкая 2 см нужна для точной линии корней и фольгирования при балаяже. Кисти из настоящего синтетического волоса (taklon, полиэстер) сохраняют форму после 200+ окрашиваний; дешёвые нейлоновые ломаются через 30. Скопление краски у основания ворса — признак изношенной или слишком толстой кисти.',
        },
        {
          heading: 'Миски и лопатки',
          body: 'Пластиковые (PE) миски — стандарт; химически нейтральны с оксидантом. Металлические миски строго НЕЛЬЗЯ: реакция окисления с железом даёт нежелательные рефлексы в смеси. Миска должна иметь прочный левосторонний захват с пальцевыми упорами — гладкие миски скользят во время работы. Лопатки — силиконовые, гибкие, чтобы краска полностью выскребалась из миски без потери продукта.',
        },
        {
          heading: 'Фольга и альтернативы из бумаги',
          body: 'Стандартный лист фольги 35×40 см подходит для средних волос. Для коротких — 25×30 см. Профессиональная фольга (15 микрон) легко складывается и удерживает тепло — ускоренное окисление позволяет сократить время выдержки на 5 минут. Бумажные альтернативы (kraft paper, компостируемые слои) подходят для экосалонов, но стоят в 2–3 раза дороже и хуже удерживают тепло.',
        },
        {
          heading: 'Пеньюары и защита клиента',
          body: 'Водонепроницаемый (PU-coated) пеньюар — обязательная часть инвентаря, защищает одежду клиента от брызг краски и оксиданта. Стирка при 60°C с салонным отбеливателем раз в неделю. Одноразовые бумажные пеньюары — дополнение для салонов с высоким потоком клиентов. Защитная полоса на шее — мягкое силиконовое уплотнение у затылка предотвращает попадание холодной смеси на одежду.',
        },
        {
          heading: 'Средства гигиены',
          body: 'Одноразовые нитриловые перчатки (не латекс) — стандарт; латекс может вызвать аллергию у мастера и клиента. Дезинфекторы поверхностей (этанол 70% + хлоргексидин) — ежедневная обработка рабочего места между клиентами. Гигиена насадки душа в мойке — раз в неделю замачивать в растворе лимонной кислоты для удаления отложений кальция.',
        },
      ],
    },
  },
}

/**
 * Helper'is — grąžina kategorijos turinį pagal slug ir lokalę.
 * Jei kategorijai nėra turinio (pvz. nauja kategorija ateityje) —
 * grąžina null, ir komponentas tiesiog nieko neatvaizduoja.
 */
export function getCategorySeoContent(
  slug: string,
  lang: Locale
): CategorySeo | null {
  const entry = categorySeoContent[slug]
  return entry ? entry[lang] : null
}

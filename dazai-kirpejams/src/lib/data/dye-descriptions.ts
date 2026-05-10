/**
 * Color SHOCK 50 atspalvių unikalūs aprašymai SEO ir profesionalų UX.
 *
 * Ankstesnis variantas naudojo vieną šabloną visiems 50 dažams, kuris
 * skyrėsi tik spalvos pavadinimu — Google šitą mato kaip duplicate content
 * ir bloginama 50 puslapių rikiavimo galimybė. Čia kiekvienam slug'ui —
 * skirtinga 1–2 sakinių žinutė: identitetas + naudojimo atvejis.
 *
 * Maintaining: jei prideda naują atspalvį, pridėk jam aprašymą čia.
 * Be aprašymo gauni fallback'ą iš `mock-products.ts`.
 */

export type DyeDescription = {
  lt: string
  en: string
  ru: string
}

export const dyeDescriptions: Record<string, DyeDescription> = {
  // ============ NATURAL (.0) — neutralūs natūralūs ============
  'color-shock-1-00': {
    lt: 'Sodri natūrali juoda be mėlyno reflekso — patikima bazė ir 100% žilų plaukų dengimas su 6% oksidantu.',
    en: 'Deep natural black with no blue reflect — a reliable base that delivers 100% grey coverage when mixed with 6% developer.',
    ru: 'Насыщенный натуральный чёрный без синего рефлекса — надёжная база и 100% закрашивание седины с оксидантом 6%.',
  },
  'color-shock-3-00': {
    lt: 'Klasikinė tamsiai ruda be šaltų ar šiltų akcentų — atstato natūralų toną su prognozuojamu rezultatu salone.',
    en: 'Classic dark brown with neither cool nor warm bias — restores the natural tone with predictable salon results.',
    ru: 'Классический тёмно-коричневый без тёплых или холодных акцентов — восстанавливает натуральный тон с предсказуемым результатом.',
  },
  'color-shock-4-00': {
    lt: 'Vidutinis ruda be papildomo refleksinio žaidimo — universalus pagrindas, kuriam galima pridėti bet kokį papildomą atspalvį.',
    en: 'A neutral mid-brown with no secondary reflect — a universal base that mixes well with any added tonal modifier.',
    ru: 'Нейтральный средне-коричневый без вторичного рефлекса — универсальная база, к которой можно добавить любой тон.',
  },
  'color-shock-5-00': {
    lt: 'Šviesiai ruda neutrali — kasdienis kirpėjų pasirinkimas natūraliems tonų perėjimams ir pradinėms žilumos korekcijoms.',
    en: 'A neutral light brown — the everyday salon pick for natural transitions and starter grey corrections.',
    ru: 'Нейтральный светло-коричневый — ежедневный выбор парикмахеров для натуральных переходов и базовой коррекции седины.',
  },
  'color-shock-6-00': {
    lt: 'Tamsi blondinė be antrinio reflekso — švelnus pakėlimas iš rudos zonos be tono iškreipimo.',
    en: 'A neutral dark blonde with no underlying reflect — a soft lift out of the brown zone without tonal drift.',
    ru: 'Тёмный блонд без вторичного рефлекса — мягкий подъём из коричневой зоны без искажения тона.',
  },
  'color-shock-7-00': {
    lt: 'Sodri vidutinė blondinė su pilnu pigmento padengimu — be aukso ar pelenų pakraipos, tobulai žaliavinis.',
    en: 'A saturated medium blonde with full pigment payoff — neither gold nor ash, ready as a clean pure base.',
    ru: 'Насыщенный средний блонд с полным пигментным покрытием — без золотистого или пепельного уклона, идеальная чистая база.',
  },
  'color-shock-8-00': {
    lt: 'Tyra šviesi blondinė be šiltų ar šaltų natų — neutrali bazė papildomam toninimui ar pasteliniam efektui.',
    en: 'A pure light blonde with no warm or cool notes — a neutral canvas for further toning or pastel finishes.',
    ru: 'Чистый светлый блонд без тёплых или холодных нот — нейтральная база для дальнейшего тонирования или пастельного эффекта.',
  },
  'color-shock-9-00': {
    lt: 'Šviesi natūrali blondinė be antrinio reflekso — populiarus pagrindas tonerio aplikacijai po pirminio šviesinimo.',
    en: 'A natural light blonde with no secondary reflect — a popular base for toner application after initial lift.',
    ru: 'Натуральный светлый блонд без вторичного рефлекса — популярная база для тонирования после предварительного осветления.',
  },
  'color-shock-10-00': {
    lt: 'Aukščiausio lygio natūrali platininė blondinė — pasiekiama vienu žingsniu nuo 9 lygio bazės su 9% oksidantu.',
    en: 'The highest level of natural platinum blonde — reachable in a single step from level 9 base using 9% developer.',
    ru: 'Высший уровень натурального платинового блонда — достигается за один шаг с базы уровня 9 с оксидантом 9%.',
  },

  // ============ ASH (.1) — šaltieji pelenų refleksai ============
  'color-shock-5-1': {
    lt: 'Šaltas vidutinis ruda su tvirtu pelenų refleksu — efektyviai neutralizuoja varinius ir geltonus tonus po šviesinimo.',
    en: 'A cool mid-brown with firm ash reflect — effectively neutralises copper and yellow tones after lifting.',
    ru: 'Холодный средне-коричневый с твёрдым пепельным рефлексом — эффективно нейтрализует медные и жёлтые тона после осветления.',
  },
  'color-shock-6-1': {
    lt: 'Tamsi blondinė su tvirtu pelenų refleksu — slopina geltonumą natūraliai šviesiems plaukams po pirmojo dažymo.',
    en: 'A dark blonde with strong ash reflect — suppresses yellow on naturally light hair after the first colouring.',
    ru: 'Тёмный блонд с твёрдым пепельным рефлексом — подавляет желтизну на натуральных светлых волосах после первого окрашивания.',
  },
  'color-shock-7-1': {
    lt: 'Vidutinė pelenų blondinė — populiariausias šalto refleksinio dažymo pasirinkimas mūsų paletėje.',
    en: 'A medium ash blonde — the most-requested cool reflect choice in our palette.',
    ru: 'Средний пепельный блонд — самый популярный холодный рефлекс в нашей палитре.',
  },
  'color-shock-8-1': {
    lt: 'Šaltas šviesus pelenų atspalvis — efektyvus po pirminio šviesinimo, kai bazinis fonas yra geltonas.',
    en: 'A cool light ash shade — effective after initial lifting when the underlying canvas reads yellow.',
    ru: 'Холодный светлый пепельный оттенок — эффективен после предварительного осветления, когда подложка жёлтая.',
  },
  'color-shock-9-1': {
    lt: 'Beveik platininis pelenų atspalvis — sukuria šaltą Skandinaviško tipo blondinę be papildomo tonerio.',
    en: 'A near-platinum ash shade — creates a cool Scandinavian-style blonde without an extra toner step.',
    ru: 'Почти платиновый пепельный оттенок — создаёт холодный скандинавский блонд без дополнительного тонирования.',
  },
  'color-shock-10-1': {
    lt: 'Aukščiausio lygio šaltas platininis tonas — neutralizuoja bet kokį geltoną pagrindą iki ledinio efekto.',
    en: 'The highest level cool platinum tone — neutralises any yellow undertone all the way to an icy finish.',
    ru: 'Высший уровень холодного платинового тона — нейтрализует любую жёлтую подложку до ледяного эффекта.',
  },

  // ============ ICY CHOCOLATE — šalta (1) ============
  'color-shock-7-18': {
    lt: 'Tamsi ruda su šaltu pelenų-perlinio refleksu — moderni alternatyva klasikiniam šokoladui be šilumos.',
    en: 'A dark brown with cool ash-pearl reflect — a modern alternative to classic chocolate without the warmth.',
    ru: 'Тёмно-коричневый с холодным пепельно-жемчужным рефлексом — современная альтернатива классическому шоколаду без тепла.',
  },

  // ============ GOLDEN (.3) — šilta (1) ============
  'color-shock-9-3': {
    lt: 'Šviesi blondinė su sodriu auksiniu refleksu — sušildo veidą ir suteikia prabangos efektą salono klientui.',
    en: 'A light blonde with rich golden reflect — warms the face and adds a luxurious finish to the salon look.',
    ru: 'Светлый блонд с насыщенным золотистым рефлексом — согревает лицо и придаёт роскошный эффект клиенту салона.',
  },

  // ============ ASH PEARL (.12) — šalta (3) ============
  'color-shock-7-12': {
    lt: 'Vidutinis blondinės atspalvis su perlinėmis-pelenų natomis — elegantiškas modernus minimalizmas be ryškumo.',
    en: 'A medium blonde with pearl-ash notes — elegant modern minimalism without flashiness.',
    ru: 'Средний блонд с жемчужно-пепельными нотами — элегантный современный минимализм без яркости.',
  },
  'color-shock-8-12': {
    lt: 'Šviesi blondinė su perlinėmis natomis — refleksai be tamprumo iš geltonų, idealus po balayage.',
    en: 'A light blonde with pearl notes — reflects without yellow tug-back, ideal after balayage.',
    ru: 'Светлый блонд с жемчужными нотами — рефлексы без жёлтого отката, идеально после балаяжа.',
  },
  'color-shock-9-12': {
    lt: 'Beveik platininis perlinis tonas su violetiniu refleksu — naikina geltonumą ir sukuria dūmuotą efektą.',
    en: 'A near-platinum pearl tone with violet reflect — kills yellow and delivers a smoky finish.',
    ru: 'Почти платиновый жемчужный тон с фиолетовым рефлексом — убирает желтизну и создаёт дымчатый эффект.',
  },

  // ============ VIOLET (.22) — šalta (1) ============
  'color-shock-5-22': {
    lt: 'Vidutinė ruda su intensyviu violetiniu refleksu — egzotinė alternatyva klasikinei mahagoninei be raudonumo.',
    en: 'A medium brown with intense violet reflect — an exotic alternative to classic mahogany, free of red bias.',
    ru: 'Средне-коричневый с интенсивным фиолетовым рефлексом — экзотическая альтернатива классическому махагону без красного.',
  },

  // ============ VIOLET GOLD (.23) — neutrali (1) ============
  'color-shock-4-23': {
    lt: 'Vidutinė ruda su tabako-gintaro tonu — turtinga rudens paletė, salonų dažniausiai užsakoma rudens-žiemos sezonu.',
    en: 'A medium brown with tobacco-amber undertone — a rich autumn shade, most-ordered by salons for the cool season.',
    ru: 'Средне-коричневый с табачно-янтарным тоном — богатый осенний оттенок, самый заказываемый салонами в холодный сезон.',
  },

  // ============ WARM BEIGE (.32) — šilta (5) ============
  'color-shock-6-32': {
    lt: 'Tamsi blondinė su smėlinėmis natomis — šilta natūrali alternatyva pelenų blondinei be šaltumo.',
    en: 'A dark blonde with beige notes — a warm natural alternative to ash blonde, without the chill.',
    ru: 'Тёмный блонд с бежевыми нотами — тёплая натуральная альтернатива пепельному блонду без холода.',
  },
  'color-shock-7-32': {
    lt: 'Klasikinis smėlinis vidutinis tonas — universalus pasirinkimas natūraliems šiltiems blondams be auksinio aktyvumo.',
    en: 'A classic beige medium tone — a universal pick for warm natural blondes without overactive gold.',
    ru: 'Классический бежевый средний тон — универсальный выбор для тёплых натуральных блондов без избыточного золота.',
  },
  'color-shock-8-32': {
    lt: 'Šviesus smėlinis blondas — saulės nuvargintas efektas su švelnia šiluma, populiarus vasaros sezonu.',
    en: 'A light beige blonde — a sun-kissed finish with subtle warmth, popular through the summer season.',
    ru: 'Светлый бежевый блонд — эффект выгоревших на солнце волос с мягким теплом, популярен летом.',
  },
  'color-shock-9-32': {
    lt: 'Beveik platininis tonas su švelnia smėline šiluma — modernus blondas, kuris veidą ne baltina, o atgaivina.',
    en: 'A near-platinum tone with soft beige warmth — a modern blonde that refreshes the face rather than washing it out.',
    ru: 'Почти платиновый тон с мягким бежевым теплом — современный блонд, который освежает лицо, а не обесцвечивает его.',
  },
  'color-shock-10-32': {
    lt: 'Aukščiausio lygio smėlinė blondinė — natūralus pliažo atspalvis su neryškiais auksiniais refleksais.',
    en: 'The highest level beige blonde — a natural beach shade with subtle golden reflects.',
    ru: 'Высший уровень бежевого блонда — натуральный пляжный оттенок с мягкими золотистыми рефлексами.',
  },

  // ============ COPPER (.444) — šilta (2) ============
  'color-shock-7-444': {
    lt: 'Maksimalaus intensyvumo varinis raudonas — trigubas pigmento koeficientas garantuoja ryškiausią rezultatą paletėje.',
    en: 'A maximum-intensity copper red — triple pigment loading guarantees the brightest result in the palette.',
    ru: 'Медно-красный максимальной интенсивности — тройная пигментация даёт самый яркий результат в палитре.',
  },
  'color-shock-8-444': {
    lt: 'Šviesus intensyvus varinis tonas — apelsino-vario hibridas su vasarine šiluma, idealus dramatiškiems pakeitimams.',
    en: 'A light intense copper tone — an orange-copper hybrid with summer warmth, ideal for dramatic makeovers.',
    ru: 'Светлый интенсивный медный тон — апельсиново-медный гибрид с летним теплом, идеален для драматичных перемен.',
  },

  // ============ MAHOGANY (.5) — šilta (1) ============
  'color-shock-6-5': {
    lt: 'Klasikinis raudonmedis su sodriu vyšniniu refleksu — aristokratinis šiltas tonas su moterišku charakteriu.',
    en: 'A classic mahogany with rich cherry reflect — an aristocratic warm tone with a feminine character.',
    ru: 'Классический махагон с насыщенным вишнёвым рефлексом — аристократичный тёплый тон с женственным характером.',
  },

  // ============ RED (.66) — šilta (2) ============
  'color-shock-6-66': {
    lt: 'Tamsus raudonas su maksimaliu intensyvumu — drąsus pasirinkimas dramatiškiems salonų transformacijoms.',
    en: 'A deep red at maximum intensity — a bold pick for dramatic salon transformations.',
    ru: 'Тёмно-красный максимальной интенсивности — смелый выбор для драматичных салонных трансформаций.',
  },
  'color-shock-7-66': {
    lt: 'Vidutinis tikras raudonas — koraliuoja-vyšninis tonas be auksinio prisitaikymo, švarus signalinis akcentas.',
    en: 'A medium true red — a coral-cherry tone without gold drift, a clean statement accent.',
    ru: 'Средний истинный красный — коралльно-вишнёвый тон без золотого сноса, чистый сигнальный акцент.',
  },

  // ============ CHOCOLATE (.8) — šilta (2) ============
  'color-shock-5-8': {
    lt: 'Klasikinė šokoladinė ruda — universalus rudens-žiemos sezono pasirinkimas su sotiu kakavos refleksu.',
    en: 'A classic chocolate brown — a universal autumn-winter pick with a saturated cocoa reflect.',
    ru: 'Классический шоколадно-коричневый — универсальный выбор для осени-зимы с насыщенным какао-рефлексом.',
  },
  'color-shock-6-8': {
    lt: 'Tamsi šokoladinė blondinė su tikru kakavos refleksu — tvirtas cheminis padengimas, ilgaamžis spalvos rezultatas.',
    en: 'A dark chocolate blonde with true cocoa reflect — strong chemical coverage, long-lasting colour result.',
    ru: 'Тёмный шоколадный блонд с настоящим какао-рефлексом — стойкое химическое покрытие, долговечный результат.',
  },

  // ============ SUPERLIFT (.11/.0/.2/.12/.21/.62) — kraštutinis šviesinimas ============
  'color-shock-11-11': {
    lt: 'Maksimalaus šviesinimo platininis su dvigubu pelenų refleksu — gilus blondinės pasiekimas vienu žingsniu.',
    en: 'A maximum-lift platinum with double ash reflect — deep blonde reach achievable in a single step.',
    ru: 'Платиновый максимального осветления с двойным пепельным рефлексом — глубокий блонд за один шаг.',
  },
  'color-shock-12-0': {
    lt: 'Aukščiausias natūralaus šviesinimo lygis — be antrinio refleksinio dažymo, tyrai pakelia 4–5 tonais.',
    en: 'The top level of natural lifting — no secondary reflect, lifts cleanly by 4–5 tones.',
    ru: 'Высший уровень натурального осветления — без вторичного рефлекса, чисто поднимает на 4–5 тонов.',
  },
  'color-shock-12-2': {
    lt: 'Šviesinantis su violetiniu refleksu — vienu metu pakelia toną ir naikina geltonumą balayage technikose.',
    en: 'A lifting shade with violet reflect — simultaneously lifts and kills yellow during balayage techniques.',
    ru: 'Осветляющий с фиолетовым рефлексом — одновременно поднимает тон и убирает желтизну в технике балаяж.',
  },
  'color-shock-12-12': {
    lt: 'Šviesinantis perlinis blondas — sukuria šaltą tonkintąjį efektą be papildomo toninimo žingsnio.',
    en: 'A lifting pearl blonde — delivers a cool tinted finish without an extra toning step.',
    ru: 'Осветляющий жемчужный блонд — создаёт холодный тонированный эффект без дополнительного шага.',
  },
  'color-shock-12-21': {
    lt: 'Trigubas refleksas — šviesinimas + violetas + pelenai vienoje formulėje, kraštutinis šaltas atspalvis.',
    en: 'A triple reflect — lifting + violet + ash in one formula, the ultimate cool finish.',
    ru: 'Тройной рефлекс — осветление + фиолет + пепел в одной формуле, предельно холодный оттенок.',
  },
  'color-shock-12-62': {
    lt: 'Šviesinantis su švelniu rožiniu refleksu — modernus pastelinis blondas vienu žingsniu, populiarus jaunoms klientėms.',
    en: 'A lifting shade with soft pink reflect — a modern pastel blonde in one step, popular with younger clientele.',
    ru: 'Осветляющий с мягким розовым рефлексом — современный пастельный блонд за один шаг, популярен у молодой клиентуры.',
  },

  // ============ TONERS — be numerinio kodo (6) ============
  'color-shock-silver-grey': {
    lt: 'Sidabrinis pilkas toneras — tobulai dengia geltoną žilame natūraliame plauke, naudojamas su 1.5% oksidantu.',
    en: 'A silver-grey toner — perfect coverage of yellow on naturally grey hair, used with 1.5% developer.',
    ru: 'Серебристо-серый тонер — идеально покрывает жёлтый на натуральных седых волосах, применяется с оксидантом 1.5%.',
  },
  'color-shock-light-grey': {
    lt: 'Šviesi pilka su švelniu sidabriniu refleksu — minkštas pilkos toninimo efektas be agresyvaus pigmento.',
    en: 'A light grey with subtle silver reflect — soft grey toning effect without aggressive pigment.',
    ru: 'Светло-серый с мягким серебристым рефлексом — деликатный эффект серого тонирования без агрессивного пигмента.',
  },
  'color-shock-dark-grey': {
    lt: 'Tamsus pilkas toneras — naudojamas natūralaus pilko atspalvio palaikymui ir žilumos struktūros stilizavimui.',
    en: 'A dark grey toner — used to maintain natural grey shades and stylise greying hair structure.',
    ru: 'Тёмно-серый тонер — для поддержания натурального серого оттенка и стилизации седеющей структуры волос.',
  },
  'color-shock-silver-pearl': {
    lt: 'Sidabro ir perlo derinys — elegantiškas poliarinis toneris šaltam blondinės užbaigimui.',
    en: 'A silver-and-pearl blend — an elegant polar toner for a cool blonde finish.',
    ru: 'Сочетание серебра и жемчуга — элегантный полярный тонер для холодного завершения блонда.',
  },
  'color-shock-silver-beige': {
    lt: 'Šaltas sidabras su smėlinėmis natomis — neutralus toneris su minkštu šilumos balansu, tinka jautresnėms klientėms.',
    en: 'A cool silver with beige notes — a neutral toner with soft warmth balance, suited to more sensitive skin tones.',
    ru: 'Холодное серебро с бежевыми нотами — нейтральный тонер с мягким балансом тепла, для более чувствительных клиентов.',
  },
  'color-shock-lilac': {
    lt: 'Alyvos atspalvio toneris — modernus pasteliniam blondui, naikina geltonumą ir auksą be papildomo violeto.',
    en: 'A lilac-shade toner — modern for pastel blonde, kills yellow and gold without extra violet pigment.',
    ru: 'Тонер сиреневого оттенка — современный для пастельного блонда, убирает желтизну и золото без дополнительного фиолета.',
  },

  // ============ MEN — vyriška linija (4) ============
  'color-shock-4-men': {
    lt: 'Vyriška tamsi kaštoninė — sukurta sotaus rezultato per 5 minutes salono ekspres dažyme.',
    en: 'A men’s dark chestnut — formulated for a saturated result in 5 minutes of express salon colouring.',
    ru: 'Мужской тёмно-каштановый — создан для насыщенного результата за 5 минут экспресс-окрашивания.',
  },
  'color-shock-5-men': {
    lt: 'Vyriška vidutinė kaštoninė — natūraliai dengia žilumą per trumpą salono klientų laiką.',
    en: 'A men’s medium chestnut — naturally covers grey within the short salon visit window.',
    ru: 'Мужской средний каштановый — натурально закрашивает седину за короткое время визита клиента.',
  },
  'color-shock-6-men': {
    lt: 'Vyriška tamsi blondinė formulė — be intensyvaus refleksinio dažymo, tikras natūralus salono rezultatas.',
    en: 'A men’s dark blonde formula — no intense reflect, just an authentic natural salon result.',
    ru: 'Мужская формула тёмного блонда — без интенсивного рефлекса, настоящий натуральный салонный результат.',
  },
  'color-shock-7-men': {
    lt: 'Vyriška vidutinė blondinė — pažangus žilų plaukų dengimas su natūralia atspalvio reprodukcija.',
    en: 'A men’s medium blonde — advanced grey coverage with natural shade reproduction.',
    ru: 'Мужской средний блонд — продвинутое закрашивание седины с натуральным воспроизведением оттенка.',
  },
}

/**
 * Helper'is — grąžina aprašymą pagal slug ir lokalę. Jei nėra map'e —
 * kvietėjas gauna `null` ir sprendžia, ką daryti (paprastai naudoja
 * fallback iš mock-products.ts).
 */
export function getDyeDescription(
  slug: string,
  lang: 'lt' | 'en' | 'ru'
): string | null {
  const entry = dyeDescriptions[slug]
  return entry ? entry[lang] : null
}

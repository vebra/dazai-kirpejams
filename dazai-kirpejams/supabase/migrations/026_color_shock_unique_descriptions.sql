-- ============================================
-- 026: Color SHOCK 50 atspalvių unikalūs SEO aprašymai
-- ============================================
--
-- Anksčiau visi 50 dažų produktų naudojo vieną aprašymo šabloną, kuriame
-- skyrėsi tik atspalvio pavadinimas — Google šitą mato kaip duplicate
-- content per 50 puslapių, blogina visų jų rikiavimą paieškoje.
--
-- Šitas migration'as kiekvienam slug'ui įrašo unikalų 1–2 sakinių
-- aprašymą LT/EN/RU su konkrečia atspalvio pozicija ir naudojimo atveju.
-- Šaltinio duomenys: src/lib/data/dye-descriptions.ts (sinchronizuoti).
--
-- Saugumas: tik UPDATE, jokių INSERT/DELETE. Jei produkto slug'as
-- neegzistuoja DB'e — eilutė ignoruojama (WHERE EXISTS sąlyga).

-- NATURAL (.0)
update products set
  description_lt = 'Sodri natūrali juoda be mėlyno reflekso — patikima bazė ir 100% žilų plaukų dengimas su 6% oksidantu.',
  description_en = 'Deep natural black with no blue reflect — a reliable base that delivers 100% grey coverage when mixed with 6% developer.',
  description_ru = 'Насыщенный натуральный чёрный без синего рефлекса — надёжная база и 100% закрашивание седины с оксидантом 6%.'
where slug = 'color-shock-1-00';

update products set
  description_lt = 'Klasikinė tamsiai ruda be šaltų ar šiltų akcentų — atstato natūralų toną su prognozuojamu rezultatu salone.',
  description_en = 'Classic dark brown with neither cool nor warm bias — restores the natural tone with predictable salon results.',
  description_ru = 'Классический тёмно-коричневый без тёплых или холодных акцентов — восстанавливает натуральный тон с предсказуемым результатом.'
where slug = 'color-shock-3-00';

update products set
  description_lt = 'Vidutinis ruda be papildomo refleksinio žaidimo — universalus pagrindas, kuriam galima pridėti bet kokį papildomą atspalvį.',
  description_en = 'A neutral mid-brown with no secondary reflect — a universal base that mixes well with any added tonal modifier.',
  description_ru = 'Нейтральный средне-коричневый без вторичного рефлекса — универсальная база, к которой можно добавить любой тон.'
where slug = 'color-shock-4-00';

update products set
  description_lt = 'Šviesiai ruda neutrali — kasdienis kirpėjų pasirinkimas natūraliems tonų perėjimams ir pradinėms žilumos korekcijoms.',
  description_en = 'A neutral light brown — the everyday salon pick for natural transitions and starter grey corrections.',
  description_ru = 'Нейтральный светло-коричневый — ежедневный выбор парикмахеров для натуральных переходов и базовой коррекции седины.'
where slug = 'color-shock-5-00';

update products set
  description_lt = 'Tamsi blondinė be antrinio reflekso — švelnus pakėlimas iš rudos zonos be tono iškreipimo.',
  description_en = 'A neutral dark blonde with no underlying reflect — a soft lift out of the brown zone without tonal drift.',
  description_ru = 'Тёмный блонд без вторичного рефлекса — мягкий подъём из коричневой зоны без искажения тона.'
where slug = 'color-shock-6-00';

update products set
  description_lt = 'Sodri vidutinė blondinė su pilnu pigmento padengimu — be aukso ar pelenų pakraipos, tobulai žaliavinis.',
  description_en = 'A saturated medium blonde with full pigment payoff — neither gold nor ash, ready as a clean pure base.',
  description_ru = 'Насыщенный средний блонд с полным пигментным покрытием — без золотистого или пепельного уклона, идеальная чистая база.'
where slug = 'color-shock-7-00';

update products set
  description_lt = 'Tyra šviesi blondinė be šiltų ar šaltų natų — neutrali bazė papildomam toninimui ar pasteliniam efektui.',
  description_en = 'A pure light blonde with no warm or cool notes — a neutral canvas for further toning or pastel finishes.',
  description_ru = 'Чистый светлый блонд без тёплых или холодных нот — нейтральная база для дальнейшего тонирования или пастельного эффекта.'
where slug = 'color-shock-8-00';

update products set
  description_lt = 'Šviesi natūrali blondinė be antrinio reflekso — populiarus pagrindas tonerio aplikacijai po pirminio šviesinimo.',
  description_en = 'A natural light blonde with no secondary reflect — a popular base for toner application after initial lift.',
  description_ru = 'Натуральный светлый блонд без вторичного рефлекса — популярная база для тонирования после предварительного осветления.'
where slug = 'color-shock-9-00';

update products set
  description_lt = 'Aukščiausio lygio natūrali platininė blondinė — pasiekiama vienu žingsniu nuo 9 lygio bazės su 9% oksidantu.',
  description_en = 'The highest level of natural platinum blonde — reachable in a single step from level 9 base using 9% developer.',
  description_ru = 'Высший уровень натурального платинового блонда — достигается за один шаг с базы уровня 9 с оксидантом 9%.'
where slug = 'color-shock-10-00';

-- ASH (.1)
update products set
  description_lt = 'Šaltas vidutinis ruda su tvirtu pelenų refleksu — efektyviai neutralizuoja varinius ir geltonus tonus po šviesinimo.',
  description_en = 'A cool mid-brown with firm ash reflect — effectively neutralises copper and yellow tones after lifting.',
  description_ru = 'Холодный средне-коричневый с твёрдым пепельным рефлексом — эффективно нейтрализует медные и жёлтые тона после осветления.'
where slug = 'color-shock-5-1';

update products set
  description_lt = 'Tamsi blondinė su tvirtu pelenų refleksu — slopina geltonumą natūraliai šviesiems plaukams po pirmojo dažymo.',
  description_en = 'A dark blonde with strong ash reflect — suppresses yellow on naturally light hair after the first colouring.',
  description_ru = 'Тёмный блонд с твёрдым пепельным рефлексом — подавляет желтизну на натуральных светлых волосах после первого окрашивания.'
where slug = 'color-shock-6-1';

update products set
  description_lt = 'Vidutinė pelenų blondinė — populiariausias šalto refleksinio dažymo pasirinkimas mūsų paletėje.',
  description_en = 'A medium ash blonde — the most-requested cool reflect choice in our palette.',
  description_ru = 'Средний пепельный блонд — самый популярный холодный рефлекс в нашей палитре.'
where slug = 'color-shock-7-1';

update products set
  description_lt = 'Šaltas šviesus pelenų atspalvis — efektyvus po pirminio šviesinimo, kai bazinis fonas yra geltonas.',
  description_en = 'A cool light ash shade — effective after initial lifting when the underlying canvas reads yellow.',
  description_ru = 'Холодный светлый пепельный оттенок — эффективен после предварительного осветления, когда подложка жёлтая.'
where slug = 'color-shock-8-1';

update products set
  description_lt = 'Beveik platininis pelenų atspalvis — sukuria šaltą Skandinaviško tipo blondinę be papildomo tonerio.',
  description_en = 'A near-platinum ash shade — creates a cool Scandinavian-style blonde without an extra toner step.',
  description_ru = 'Почти платиновый пепельный оттенок — создаёт холодный скандинавский блонд без дополнительного тонирования.'
where slug = 'color-shock-9-1';

update products set
  description_lt = 'Aukščiausio lygio šaltas platininis tonas — neutralizuoja bet kokį geltoną pagrindą iki ledinio efekto.',
  description_en = 'The highest level cool platinum tone — neutralises any yellow undertone all the way to an icy finish.',
  description_ru = 'Высший уровень холодного платинового тона — нейтрализует любую жёлтую подложку до ледяного эффекта.'
where slug = 'color-shock-10-1';

-- ICY CHOCOLATE
update products set
  description_lt = 'Tamsi ruda su šaltu pelenų-perlinio refleksu — moderni alternatyva klasikiniam šokoladui be šilumos.',
  description_en = 'A dark brown with cool ash-pearl reflect — a modern alternative to classic chocolate without the warmth.',
  description_ru = 'Тёмно-коричневый с холодным пепельно-жемчужным рефлексом — современная альтернатива классическому шоколаду без тепла.'
where slug = 'color-shock-7-18';

-- GOLDEN (.3)
update products set
  description_lt = 'Šviesi blondinė su sodriu auksiniu refleksu — sušildo veidą ir suteikia prabangos efektą salono klientui.',
  description_en = 'A light blonde with rich golden reflect — warms the face and adds a luxurious finish to the salon look.',
  description_ru = 'Светлый блонд с насыщенным золотистым рефлексом — согревает лицо и придаёт роскошный эффект клиенту салона.'
where slug = 'color-shock-9-3';

-- ASH PEARL (.12)
update products set
  description_lt = 'Vidutinis blondinės atspalvis su perlinėmis-pelenų natomis — elegantiškas modernus minimalizmas be ryškumo.',
  description_en = 'A medium blonde with pearl-ash notes — elegant modern minimalism without flashiness.',
  description_ru = 'Средний блонд с жемчужно-пепельными нотами — элегантный современный минимализм без яркости.'
where slug = 'color-shock-7-12';

update products set
  description_lt = 'Šviesi blondinė su perlinėmis natomis — refleksai be tamprumo iš geltonų, idealus po balayage.',
  description_en = 'A light blonde with pearl notes — reflects without yellow tug-back, ideal after balayage.',
  description_ru = 'Светлый блонд с жемчужными нотами — рефлексы без жёлтого отката, идеально после балаяжа.'
where slug = 'color-shock-8-12';

update products set
  description_lt = 'Beveik platininis perlinis tonas su violetiniu refleksu — naikina geltonumą ir sukuria dūmuotą efektą.',
  description_en = 'A near-platinum pearl tone with violet reflect — kills yellow and delivers a smoky finish.',
  description_ru = 'Почти платиновый жемчужный тон с фиолетовым рефлексом — убирает желтизну и создаёт дымчатый эффект.'
where slug = 'color-shock-9-12';

-- VIOLET (.22)
update products set
  description_lt = 'Vidutinė ruda su intensyviu violetiniu refleksu — egzotinė alternatyva klasikinei mahagoninei be raudonumo.',
  description_en = 'A medium brown with intense violet reflect — an exotic alternative to classic mahogany, free of red bias.',
  description_ru = 'Средне-коричневый с интенсивным фиолетовым рефлексом — экзотическая альтернатива классическому махагону без красного.'
where slug = 'color-shock-5-22';

-- VIOLET GOLD (.23)
update products set
  description_lt = 'Vidutinė ruda su tabako-gintaro tonu — turtinga rudens paletė, salonų dažniausiai užsakoma rudens-žiemos sezonu.',
  description_en = 'A medium brown with tobacco-amber undertone — a rich autumn shade, most-ordered by salons for the cool season.',
  description_ru = 'Средне-коричневый с табачно-янтарным тоном — богатый осенний оттенок, самый заказываемый салонами в холодный сезон.'
where slug = 'color-shock-4-23';

-- WARM BEIGE (.32)
update products set
  description_lt = 'Tamsi blondinė su smėlinėmis natomis — šilta natūrali alternatyva pelenų blondinei be šaltumo.',
  description_en = 'A dark blonde with beige notes — a warm natural alternative to ash blonde, without the chill.',
  description_ru = 'Тёмный блонд с бежевыми нотами — тёплая натуральная альтернатива пепельному блонду без холода.'
where slug = 'color-shock-6-32';

update products set
  description_lt = 'Klasikinis smėlinis vidutinis tonas — universalus pasirinkimas natūraliems šiltiems blondams be auksinio aktyvumo.',
  description_en = 'A classic beige medium tone — a universal pick for warm natural blondes without overactive gold.',
  description_ru = 'Классический бежевый средний тон — универсальный выбор для тёплых натуральных блондов без избыточного золота.'
where slug = 'color-shock-7-32';

update products set
  description_lt = 'Šviesus smėlinis blondas — saulės nuvargintas efektas su švelnia šiluma, populiarus vasaros sezonu.',
  description_en = 'A light beige blonde — a sun-kissed finish with subtle warmth, popular through the summer season.',
  description_ru = 'Светлый бежевый блонд — эффект выгоревших на солнце волос с мягким теплом, популярен летом.'
where slug = 'color-shock-8-32';

update products set
  description_lt = 'Beveik platininis tonas su švelnia smėline šiluma — modernus blondas, kuris veidą ne baltina, o atgaivina.',
  description_en = 'A near-platinum tone with soft beige warmth — a modern blonde that refreshes the face rather than washing it out.',
  description_ru = 'Почти платиновый тон с мягким бежевым теплом — современный блонд, который освежает лицо, а не обесцвечивает его.'
where slug = 'color-shock-9-32';

update products set
  description_lt = 'Aukščiausio lygio smėlinė blondinė — natūralus pliažo atspalvis su neryškiais auksiniais refleksais.',
  description_en = 'The highest level beige blonde — a natural beach shade with subtle golden reflects.',
  description_ru = 'Высший уровень бежевого блонда — натуральный пляжный оттенок с мягкими золотистыми рефлексами.'
where slug = 'color-shock-10-32';

-- COPPER (.444)
update products set
  description_lt = 'Maksimalaus intensyvumo varinis raudonas — trigubas pigmento koeficientas garantuoja ryškiausią rezultatą paletėje.',
  description_en = 'A maximum-intensity copper red — triple pigment loading guarantees the brightest result in the palette.',
  description_ru = 'Медно-красный максимальной интенсивности — тройная пигментация даёт самый яркий результат в палитре.'
where slug = 'color-shock-7-444';

update products set
  description_lt = 'Šviesus intensyvus varinis tonas — apelsino-vario hibridas su vasarine šiluma, idealus dramatiškiems pakeitimams.',
  description_en = 'A light intense copper tone — an orange-copper hybrid with summer warmth, ideal for dramatic makeovers.',
  description_ru = 'Светлый интенсивный медный тон — апельсиново-медный гибрид с летним теплом, идеален для драматичных перемен.'
where slug = 'color-shock-8-444';

-- MAHOGANY (.5)
update products set
  description_lt = 'Klasikinis raudonmedis su sodriu vyšniniu refleksu — aristokratinis šiltas tonas su moterišku charakteriu.',
  description_en = 'A classic mahogany with rich cherry reflect — an aristocratic warm tone with a feminine character.',
  description_ru = 'Классический махагон с насыщенным вишнёвым рефлексом — аристократичный тёплый тон с женственным характером.'
where slug = 'color-shock-6-5';

-- RED (.66)
update products set
  description_lt = 'Tamsus raudonas su maksimaliu intensyvumu — drąsus pasirinkimas dramatiškiems salonų transformacijoms.',
  description_en = 'A deep red at maximum intensity — a bold pick for dramatic salon transformations.',
  description_ru = 'Тёмно-красный максимальной интенсивности — смелый выбор для драматичных салонных трансформаций.'
where slug = 'color-shock-6-66';

update products set
  description_lt = 'Vidutinis tikras raudonas — koraliuoja-vyšninis tonas be auksinio prisitaikymo, švarus signalinis akcentas.',
  description_en = 'A medium true red — a coral-cherry tone without gold drift, a clean statement accent.',
  description_ru = 'Средний истинный красный — коралльно-вишнёвый тон без золотого сноса, чистый сигнальный акцент.'
where slug = 'color-shock-7-66';

-- CHOCOLATE (.8)
update products set
  description_lt = 'Klasikinė šokoladinė ruda — universalus rudens-žiemos sezono pasirinkimas su sotiu kakavos refleksu.',
  description_en = 'A classic chocolate brown — a universal autumn-winter pick with a saturated cocoa reflect.',
  description_ru = 'Классический шоколадно-коричневый — универсальный выбор для осени-зимы с насыщенным какао-рефлексом.'
where slug = 'color-shock-5-8';

update products set
  description_lt = 'Tamsi šokoladinė blondinė su tikru kakavos refleksu — tvirtas cheminis padengimas, ilgaamžis spalvos rezultatas.',
  description_en = 'A dark chocolate blonde with true cocoa reflect — strong chemical coverage, long-lasting colour result.',
  description_ru = 'Тёмный шоколадный блонд с настоящим какао-рефлексом — стойкое химическое покрытие, долговечный результат.'
where slug = 'color-shock-6-8';

-- SUPERLIFT
update products set
  description_lt = 'Maksimalaus šviesinimo platininis su dvigubu pelenų refleksu — gilus blondinės pasiekimas vienu žingsniu.',
  description_en = 'A maximum-lift platinum with double ash reflect — deep blonde reach achievable in a single step.',
  description_ru = 'Платиновый максимального осветления с двойным пепельным рефлексом — глубокий блонд за один шаг.'
where slug = 'color-shock-11-11';

update products set
  description_lt = 'Aukščiausias natūralaus šviesinimo lygis — be antrinio refleksinio dažymo, tyrai pakelia 4–5 tonais.',
  description_en = 'The top level of natural lifting — no secondary reflect, lifts cleanly by 4–5 tones.',
  description_ru = 'Высший уровень натурального осветления — без вторичного рефлекса, чисто поднимает на 4–5 тонов.'
where slug = 'color-shock-12-0';

update products set
  description_lt = 'Šviesinantis su violetiniu refleksu — vienu metu pakelia toną ir naikina geltonumą balayage technikose.',
  description_en = 'A lifting shade with violet reflect — simultaneously lifts and kills yellow during balayage techniques.',
  description_ru = 'Осветляющий с фиолетовым рефлексом — одновременно поднимает тон и убирает желтизну в технике балаяж.'
where slug = 'color-shock-12-2';

update products set
  description_lt = 'Šviesinantis perlinis blondas — sukuria šaltą tonkintąjį efektą be papildomo toninimo žingsnio.',
  description_en = 'A lifting pearl blonde — delivers a cool tinted finish without an extra toning step.',
  description_ru = 'Осветляющий жемчужный блонд — создаёт холодный тонированный эффект без дополнительного шага.'
where slug = 'color-shock-12-12';

update products set
  description_lt = 'Trigubas refleksas — šviesinimas + violetas + pelenai vienoje formulėje, kraštutinis šaltas atspalvis.',
  description_en = 'A triple reflect — lifting + violet + ash in one formula, the ultimate cool finish.',
  description_ru = 'Тройной рефлекс — осветление + фиолет + пепел в одной формуле, предельно холодный оттенок.'
where slug = 'color-shock-12-21';

update products set
  description_lt = 'Šviesinantis su švelniu rožiniu refleksu — modernus pastelinis blondas vienu žingsniu, populiarus jaunoms klientėms.',
  description_en = 'A lifting shade with soft pink reflect — a modern pastel blonde in one step, popular with younger clientele.',
  description_ru = 'Осветляющий с мягким розовым рефлексом — современный пастельный блонд за один шаг, популярен у молодой клиентуры.'
where slug = 'color-shock-12-62';

-- TONERS (be numerinio kodo)
update products set
  description_lt = 'Sidabrinis pilkas toneras — tobulai dengia geltoną žilame natūraliame plauke, naudojamas su 1.5% oksidantu.',
  description_en = 'A silver-grey toner — perfect coverage of yellow on naturally grey hair, used with 1.5% developer.',
  description_ru = 'Серебристо-серый тонер — идеально покрывает жёлтый на натуральных седых волосах, применяется с оксидантом 1.5%.'
where slug = 'color-shock-silver-grey';

update products set
  description_lt = 'Šviesi pilka su švelniu sidabriniu refleksu — minkštas pilkos toninimo efektas be agresyvaus pigmento.',
  description_en = 'A light grey with subtle silver reflect — soft grey toning effect without aggressive pigment.',
  description_ru = 'Светло-серый с мягким серебристым рефлексом — деликатный эффект серого тонирования без агрессивного пигмента.'
where slug = 'color-shock-light-grey';

update products set
  description_lt = 'Tamsus pilkas toneras — naudojamas natūralaus pilko atspalvio palaikymui ir žilumos struktūros stilizavimui.',
  description_en = 'A dark grey toner — used to maintain natural grey shades and stylise greying hair structure.',
  description_ru = 'Тёмно-серый тонер — для поддержания натурального серого оттенка и стилизации седеющей структуры волос.'
where slug = 'color-shock-dark-grey';

update products set
  description_lt = 'Sidabro ir perlo derinys — elegantiškas poliarinis toneris šaltam blondinės užbaigimui.',
  description_en = 'A silver-and-pearl blend — an elegant polar toner for a cool blonde finish.',
  description_ru = 'Сочетание серебра и жемчуга — элегантный полярный тонер для холодного завершения блонда.'
where slug = 'color-shock-silver-pearl';

update products set
  description_lt = 'Šaltas sidabras su smėlinėmis natomis — neutralus toneris su minkštu šilumos balansu, tinka jautresnėms klientėms.',
  description_en = 'A cool silver with beige notes — a neutral toner with soft warmth balance, suited to more sensitive skin tones.',
  description_ru = 'Холодное серебро с бежевыми нотами — нейтральный тонер с мягким балансом тепла, для более чувствительных клиентов.'
where slug = 'color-shock-silver-beige';

update products set
  description_lt = 'Alyvos atspalvio toneris — modernus pasteliniam blondui, naikina geltonumą ir auksą be papildomo violeto.',
  description_en = 'A lilac-shade toner — modern for pastel blonde, kills yellow and gold without extra violet pigment.',
  description_ru = 'Тонер сиреневого оттенка — современный для пастельного блонда, убирает желтизну и золото без дополнительного фиолета.'
where slug = 'color-shock-lilac';

-- MEN linija (4)
update products set
  description_lt = 'Vyriška tamsi kaštoninė — sukurta sotaus rezultato per 5 minutes salono ekspres dažyme.',
  description_en = 'A men''s dark chestnut — formulated for a saturated result in 5 minutes of express salon colouring.',
  description_ru = 'Мужской тёмно-каштановый — создан для насыщенного результата за 5 минут экспресс-окрашивания.'
where slug = 'color-shock-4-men';

update products set
  description_lt = 'Vyriška vidutinė kaštoninė — natūraliai dengia žilumą per trumpą salono klientų laiką.',
  description_en = 'A men''s medium chestnut — naturally covers grey within the short salon visit window.',
  description_ru = 'Мужской средний каштановый — натурально закрашивает седину за короткое время визита клиента.'
where slug = 'color-shock-5-men';

update products set
  description_lt = 'Vyriška tamsi blondinė formulė — be intensyvaus refleksinio dažymo, tikras natūralus salono rezultatas.',
  description_en = 'A men''s dark blonde formula — no intense reflect, just an authentic natural salon result.',
  description_ru = 'Мужская формула тёмного блонда — без интенсивного рефлекса, настоящий натуральный салонный результат.'
where slug = 'color-shock-6-men';

update products set
  description_lt = 'Vyriška vidutinė blondinė — pažangus žilų plaukų dengimas su natūralia atspalvio reprodukcija.',
  description_en = 'A men''s medium blonde — advanced grey coverage with natural shade reproduction.',
  description_ru = 'Мужской средний блонд — продвинутое закрашивание седины с натуральным воспроизведением оттенка.'
where slug = 'color-shock-7-men';

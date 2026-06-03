-- ============================================
-- 038: Atnaujinti „180 ml vs 60 ml" straipsnį
-- ============================================
-- 1) Suvienodinti kainas su skaičiuokle (/skaiciuokle):
--    konkurentas ~11,00 € (0,183 €/ml), Color SHOCK 7,90 € (0,044 €/ml)
--    (anksčiau straipsnis rodė ~5,00 € / 0,083 €/ml — atsilikęs nuo skaičiuoklės)
-- 2) Suvienodinti Color SHOCK kainą: LT versija rodė 7,99 €, EN/RU — 7,90 €; visur 7,90 €
-- 3) Pridėti DUK (FAQ) sekciją visomis kalbomis
-- Idempotentiška: galima paleisti pakartotinai (UPDATE pagal slug).
-- ============================================

UPDATE blog_posts
SET
  content_lt = '<p>Profesionaliam kirpėjui ar koloristui dažų pakuotės dydis yra ne estetinis, o ekonominis klausimas. Kiekviena papildoma pakuotė, kurią atidarote per dieną, — tai papildomos išlaidos, papildomos atliekos ir papildomas laikas užsakymams tvarkyti. Šiame straipsnyje palyginsime standartinę 60 ml ir Color SHOCK 180 ml pakuotes — skaičiais, faktais ir praktiniu požiūriu.</p>
<h2>Standartinė 60 ml pakuotė</h2>
<p>Dauguma profesionalių plaukų dažų gamintojų Europoje siūlo 60 ml tūbio formato pakuotes. Tai ilgametis rinkos standartas, prie kurio įpratusi dauguma specialistų. Vieno dažymo metu vidutiniškai sunaudojama 60–80 ml dažų mišinio (dažai + oksidantas), o tai reiškia, kad viena pakuotė dažnai išnaudojama per vieną procedūrą.</p>
<p>Salonams, kurie aptarnauja keliolika klienčių kasdien, tai reiškia didelį pakuočių kiekį per mėnesį. Kiekviena pakuotė — tai ir kaina, ir logistika, ir atliekos. Be to, ne visada tiksliai sunaudojamas visas tūris: dažnai tūbio dugne lieka 5–10 ml produkto, kurio nebeįmanoma panaudoti.</p>
<h2>Color SHOCK 180 ml pranašumas</h2>
<p>Color SHOCK profesionalūs plaukų dažai pateikiami <strong>180 ml pakuotėse</strong> — tai triskart didesnė talpa nei rinkos standartas. Šis sprendimas buvo sukurtas būtent profesionalams, dirbantiems intensyviai ir kasdien.</p>
<p>Didesnė pakuotė suteikia keletą svarbių pranašumų:</p>
<ul><li><strong>Mažesnė kaina per ml</strong> — didesnė talpa leidžia taikyti ekonomiškesnę kainodarą</li><li><strong>Mažiau atliekų</strong> — viena pakuotė atstoja tris standartines, tai reiškia tris kartus mažiau atliekų</li><li><strong>Patogesnis naudojimas</strong> — rečiau reikia keisti tūbius darbo metu</li><li><strong>Paprastesnė logistika</strong> — mažiau pakuočių užsakyti, saugoti ir tvarkyti</li><li><strong>Mažiau iššvaistyto produkto</strong> — procentaliai mažiau dažų lieka tūbio dugne</li></ul>
<h2>Palyginimo lentelė</h2>
<p>Pažiūrėkime konkrečius skaičius, lyginant standartinę 60 ml pakuotę su Color SHOCK 180 ml:</p>
<table><thead><tr><th>Parametras</th><th>Standartiniai dažai (60 ml)</th><th>Color SHOCK (180 ml)</th></tr></thead><tbody><tr><td>Talpa</td><td>60 ml</td><td>180 ml</td></tr><tr><td>Kaina</td><td>~11,00 €</td><td>7,90 €</td></tr><tr><td>Kaina per ml</td><td>~0,183 €/ml</td><td>0,044 €/ml</td></tr><tr><td>Pakuočių per mėnesį (80 dažymų)</td><td>~80 vnt.</td><td>~27 vnt.</td></tr><tr><td>Atliekos per mėnesį</td><td>80 tūbių</td><td>27 tūbiai</td></tr></tbody></table>
<blockquote>Kaina per ml — tai objektyviausias būdas palyginti dažų vertę. Color SHOCK 180 ml pakuotėje vienas mililitras kainuoja beveik keturis kartus pigiau nei standartiniuose dažuose.</blockquote>
<h2>Ekonominis skaičiavimas</h2>
<p>Paimkime konkretų pavyzdį. Salonas atlieka <strong>20 dažymų per savaitę</strong> (4 dažymai per dieną, 5 darbo dienos). Kiekvienam dažymui vidutiniškai sunaudojama 60 ml dažų (be oksidanto).</p>
<h3>Su standartiniais 60 ml dažais:</h3>
<ul><li>Per savaitę: 20 pakuočių × 11,00 € = <strong>220,00 €</strong></li><li>Per mėnesį: 80 pakuočių × 11,00 € = <strong>880,00 €</strong></li><li>Per metus: 960 pakuočių × 11,00 € = <strong>10 560,00 €</strong></li></ul>
<h3>Su Color SHOCK 180 ml:</h3>
<ul><li>Per savaitę: ~7 pakuotės × 7,90 € = <strong>55,30 €</strong></li><li>Per mėnesį: ~27 pakuotės × 7,90 € = <strong>213,30 €</strong></li><li>Per metus: ~320 pakuočių × 7,90 € = <strong>2 528,00 €</strong></li></ul>
<blockquote>Metinis sutaupymas — daugiau nei <strong>8 000 €</strong>. Tai reikšminga suma, kurią galima investuoti į salono plėtrą, naują įrangą ar darbuotojų mokymus.</blockquote>
<h2>Praktinė nauda kasdien</h2>
<p>Ekonominis aspektas — svarbus, tačiau ne vienintelis. Kasdieniam darbui salone 180 ml pakuotė suteikia ir kitokios praktinės naudos, apie kurią kolegos dažnai nekalba.</p>
<p><strong>Mažiau užsakymų.</strong> Užuot užsakę 80 tūbių per mėnesį, užsakysite 27. Tai mažiau laiko, skirto užsakymų formavimui, priėmimui ir sandėliavimui.</p>
<p><strong>Kompaktiškesnis sandėliavimas.</strong> 27 tūbiai užima žymiai mažiau vietos nei 80. Salono darbo erdvė lieka tvarkinga ir laisva.</p>
<p><strong>Mažiau atliekų.</strong> Mažiau pakuočių — mažiau plastiko atliekų. Jei Jūsų salonui svarbus tvarumo aspektas, tai konkretus žingsnis ta linkme.</p>
<p><strong>Patogesnis darbas.</strong> Viena 180 ml pakuotė gali būti naudojama keliems dažymams iš eilės, todėl nereikia nuolat atsukti naujų tūbių. Darbo procesas tampa sklandesnis ir greitesnis.</p>
<h2>Išvada</h2>
<p>Pakuotės dydis — tai ne smulkmena. Tai sprendimas, kuris kasdien veikia Jūsų salono pelningumą, darbo patogumus ir išlaidų kontrolę. Color SHOCK 180 ml pakuotė sukurta būtent tam — suteikti profesionalui daugiau produkto, mažesne kaina per ml, su mažiau rūpesčių dėl logistikos ir atliekų.</p>
<h2>Dažni klausimai</h2>
<h3>Ar 180 ml dažai skiriasi formule nuo standartinių?</h3>
<p>Skiriasi tik pakuotės dydis. Color SHOCK formulė yra profesionali, skirta darbui salone — daugiau produkto pakuotėje neturi įtakos kokybei.</p>
<h3>Kiek dažymų išeina iš vienos 180 ml pakuotės?</h3>
<p>Priklauso nuo plaukų ilgio ir technikos. Vidutinio ilgio plaukams, naudojant apie 60 ml vienam dažymui, vienos pakuotės užtenka maždaug trims dažymams — tris kartus daugiau nei iš 60 ml tūbelės.</p>
<h3>Kiek realiai sutaupo salonas per metus?</h3>
<p>Salonas, atliekantis 20 dažymų per savaitę, per metus sutaupo daugiau nei 8 000 € vien dažams (lyginant su ~11 € kainuojančia 60 ml standartine pakuote). Tikslų skaičių pagal savo apkrovą apskaičiuokite <a href="/lt/skaiciuokle" style="color: var(--magenta); font-weight: 600;">kainų skaičiuoklėje</a>.</p>
<h3>Ar didelė pakuotė tinka mažam salonui ar pavieniam kirpėjui?</h3>
<p>Taip. Net ir dirbant mažesniu tempu, mažesnė kaina per ml ir rečiau keičiamos pakuotės darbo metu išlieka naudingos. Didžiausią naudą pajunta tie, kas tuos pačius atspalvius naudoja reguliariai.</p>',

  content_en = '<p>For a professional hairdresser or colourist, the dye package size is not an aesthetic but an economic question. Every additional package you open per day means additional costs, additional waste and additional time spent managing orders. In this article, we compare the standard 60 ml and Color SHOCK 180 ml packages — with numbers, facts and a practical perspective.</p>
<h2>Standard 60 ml Package</h2>
<p>Most professional hair dye manufacturers in Europe offer 60 ml tube-format packages. This is a long-standing market standard that most specialists are accustomed to. During a single colouring, an average of 60–80 ml of dye mixture (dye + oxidant) is used, which means one package is often used up in a single procedure.</p>
<p>For salons serving dozens of clients daily, this means a large number of packages per month. Each package is a cost, a logistics task and waste. Additionally, the entire volume is not always used precisely: often 5–10 ml of product remains at the bottom of the tube that cannot be used.</p>
<h2>The Color SHOCK 180 ml Advantage</h2>
<p>Color SHOCK professional hair dyes come in <strong>180 ml packages</strong> — three times the volume of the market standard. This solution was designed specifically for professionals who work intensively and daily.</p>
<p>The larger package provides several important advantages:</p>
<ul><li><strong>Lower price per ml</strong> — the larger volume allows for more economical pricing</li><li><strong>Less waste</strong> — one package replaces three standard ones, meaning three times less waste</li><li><strong>More convenient use</strong> — less frequent tube changes during work</li><li><strong>Simpler logistics</strong> — fewer packages to order, store and manage</li><li><strong>Less wasted product</strong> — proportionally less dye remains at the bottom of the tube</li></ul>
<h2>Comparison Table</h2>
<p>Let''s look at specific numbers, comparing the standard 60 ml package with Color SHOCK 180 ml:</p>
<table><thead><tr><th>Parameter</th><th>Standard dyes (60 ml)</th><th>Color SHOCK (180 ml)</th></tr></thead><tbody><tr><td>Volume</td><td>60 ml</td><td>180 ml</td></tr><tr><td>Price</td><td>~€11.00</td><td>€7.90</td></tr><tr><td>Price per ml</td><td>~€0.183/ml</td><td>€0.044/ml</td></tr><tr><td>Packages per month (80 colourings)</td><td>~80 units</td><td>~27 units</td></tr><tr><td>Waste per month</td><td>80 tubes</td><td>27 tubes</td></tr></tbody></table>
<blockquote>Price per ml is the most objective way to compare dye value. In the Color SHOCK 180 ml package, one millilitre costs almost four times less than in standard dyes.</blockquote>
<h2>Economic Calculation</h2>
<p>Let''s take a specific example. A salon performs <strong>20 colourings per week</strong> (4 colourings per day, 5 working days). An average of 60 ml of dye (without oxidant) is used per colouring.</p>
<h3>With standard 60 ml dyes:</h3>
<ul><li>Per week: 20 packages × €11.00 = <strong>€220.00</strong></li><li>Per month: 80 packages × €11.00 = <strong>€880.00</strong></li><li>Per year: 960 packages × €11.00 = <strong>€10,560.00</strong></li></ul>
<h3>With Color SHOCK 180 ml:</h3>
<ul><li>Per week: ~7 packages × €7.90 = <strong>€55.30</strong></li><li>Per month: ~27 packages × €7.90 = <strong>€213.30</strong></li><li>Per year: ~320 packages × €7.90 = <strong>€2,528.00</strong></li></ul>
<blockquote>Annual savings — more than <strong>€8,000</strong>. This is a significant amount that can be invested in salon expansion, new equipment or staff training.</blockquote>
<h2>Practical Benefits Every Day</h2>
<p>The economic aspect is important, but not the only one. For everyday salon work, the 180 ml package also provides other practical benefits that colleagues rarely discuss.</p>
<p><strong>Fewer orders.</strong> Instead of ordering 80 tubes per month, you order 27. That''s less time spent on forming, receiving and storing orders.</p>
<p><strong>More compact storage.</strong> 27 tubes take up significantly less space than 80. The salon workspace remains tidy and clear.</p>
<p><strong>Less waste.</strong> Fewer packages means less plastic waste. If sustainability matters to Your salon, this is a concrete step in that direction.</p>
<p><strong>More convenient work.</strong> One 180 ml package can be used for several colourings in a row, so there is no need to constantly open new tubes. The workflow becomes smoother and faster.</p>
<h2>Conclusion</h2>
<p>Package size is not a minor detail. It is a decision that affects Your salon''s profitability, work convenience and cost control every day. The Color SHOCK 180 ml package was designed precisely for this — to give the professional more product, at a lower price per ml, with fewer worries about logistics and waste.</p>
<h2>Frequently Asked Questions</h2>
<h3>Does the 180 ml dye differ in formula from standard ones?</h3>
<p>Only the package size differs. The Color SHOCK formula is professional, designed for salon work — more product in the package has no effect on quality.</p>
<h3>How many colourings does one 180 ml package provide?</h3>
<p>It depends on hair length and technique. For medium-length hair, using about 60 ml per colouring, one package is enough for roughly three colourings — three times more than a 60 ml tube.</p>
<h3>How much does a salon actually save per year?</h3>
<p>A salon performing 20 colourings per week saves more than €8,000 per year on dye alone (compared with a standard 60 ml package costing ~€11). Calculate the exact figure for your workload with the <a href="/en/skaiciuokle" style="color: var(--magenta); font-weight: 600;">price calculator</a>.</p>
<h3>Is a large package suitable for a small salon or a solo hairdresser?</h3>
<p>Yes. Even at a slower pace, the lower price per ml and fewer tube changes during work remain beneficial. Those who use the same shades regularly gain the most.</p>',

  content_ru = '<p>Для профессионального парикмахера или колориста размер упаковки краски — это не эстетический, а экономический вопрос. Каждая дополнительная упаковка, которую вы открываете за день, — это дополнительные расходы, дополнительные отходы и дополнительное время на управление заказами. В этой статье мы сравним стандартную упаковку 60 мл и Color SHOCK 180 мл — цифрами, фактами и с практической точки зрения.</p>
<h2>Стандартная упаковка 60 мл</h2>
<p>Большинство европейских производителей профессиональных красок для волос предлагают упаковки в формате тюбика 60 мл. Это давний рыночный стандарт, к которому привыкло большинство специалистов. За одно окрашивание в среднем расходуется 60–80 мл красящей смеси (краска + оксидант), а это значит, что одна упаковка часто расходуется за одну процедуру.</p>
<p>Для салонов, обслуживающих десятки клиентов ежедневно, это означает большое количество упаковок в месяц. Каждая упаковка — это и стоимость, и логистика, и отходы. К тому же не всегда весь объём используется точно: часто на дне тюбика остаётся 5–10 мл продукта, который уже невозможно использовать.</p>
<h2>Преимущество Color SHOCK 180 мл</h2>
<p>Профессиональные краски для волос Color SHOCK выпускаются в <strong>упаковках 180 мл</strong> — это втрое больший объём по сравнению с рыночным стандартом. Это решение было создано именно для профессионалов, работающих интенсивно и ежедневно.</p>
<p>Увеличенная упаковка даёт ряд важных преимуществ:</p>
<ul><li><strong>Ниже цена за мл</strong> — больший объём позволяет применять более экономичное ценообразование</li><li><strong>Меньше отходов</strong> — одна упаковка заменяет три стандартных, а значит, втрое меньше отходов</li><li><strong>Удобнее в использовании</strong> — реже нужно менять тюбики во время работы</li><li><strong>Проще логистика</strong> — меньше упаковок заказывать, хранить и обрабатывать</li><li><strong>Меньше потерь продукта</strong> — процентно меньше краски остаётся на дне тюбика</li></ul>
<h2>Сравнительная таблица</h2>
<p>Посмотрим на конкретные цифры, сравнивая стандартную упаковку 60 мл с Color SHOCK 180 мл:</p>
<table><thead><tr><th>Параметр</th><th>Стандартные краски (60 мл)</th><th>Color SHOCK (180 мл)</th></tr></thead><tbody><tr><td>Объём</td><td>60 мл</td><td>180 мл</td></tr><tr><td>Цена</td><td>~11,00 €</td><td>7,90 €</td></tr><tr><td>Цена за мл</td><td>~0,183 €/мл</td><td>0,044 €/мл</td></tr><tr><td>Упаковок в месяц (80 окрашиваний)</td><td>~80 шт.</td><td>~27 шт.</td></tr><tr><td>Отходы за месяц</td><td>80 тюбиков</td><td>27 тюбиков</td></tr></tbody></table>
<blockquote>Цена за мл — самый объективный способ сравнить ценность краски. В упаковке Color SHOCK 180 мл один миллилитр стоит почти вчетверо дешевле, чем в стандартных красках.</blockquote>
<h2>Экономический расчёт</h2>
<p>Возьмём конкретный пример. Салон выполняет <strong>20 окрашиваний в неделю</strong> (4 окрашивания в день, 5 рабочих дней). На каждое окрашивание в среднем расходуется 60 мл краски (без оксиданта).</p>
<h3>Со стандартными красками 60 мл:</h3>
<ul><li>В неделю: 20 упаковок × 11,00 € = <strong>220,00 €</strong></li><li>В месяц: 80 упаковок × 11,00 € = <strong>880,00 €</strong></li><li>В год: 960 упаковок × 11,00 € = <strong>10 560,00 €</strong></li></ul>
<h3>С Color SHOCK 180 мл:</h3>
<ul><li>В неделю: ~7 упаковок × 7,90 € = <strong>55,30 €</strong></li><li>В месяц: ~27 упаковок × 7,90 € = <strong>213,30 €</strong></li><li>В год: ~320 упаковок × 7,90 € = <strong>2 528,00 €</strong></li></ul>
<blockquote>Годовая экономия — более <strong>8 000 €</strong>. Это значительная сумма, которую можно инвестировать в развитие салона, новое оборудование или обучение персонала.</blockquote>
<h2>Практическая польза каждый день</h2>
<p>Экономический аспект важен, но не единственен. Для ежедневной работы в салоне упаковка 180 мл даёт и другую практическую пользу, о которой коллеги редко говорят.</p>
<p><strong>Меньше заказов.</strong> Вместо заказа 80 тюбиков в месяц вы заказываете 27. Это меньше времени на формирование, приём и хранение заказов.</p>
<p><strong>Компактное хранение.</strong> 27 тюбиков занимают значительно меньше места, чем 80. Рабочее пространство салона остаётся аккуратным и свободным.</p>
<p><strong>Меньше отходов.</strong> Меньше упаковок — меньше пластиковых отходов. Если для Вашего салона важен аспект экологичности, это конкретный шаг в этом направлении.</p>
<p><strong>Удобнее работать.</strong> Одну упаковку 180 мл можно использовать для нескольких окрашиваний подряд, поэтому не нужно постоянно открывать новые тюбики. Рабочий процесс становится плавнее и быстрее.</p>
<h2>Вывод</h2>
<p>Размер упаковки — это не мелочь. Это решение, которое каждый день влияет на прибыльность Вашего салона, удобство работы и контроль расходов. Упаковка Color SHOCK 180 мл создана именно для этого — дать профессионалу больше продукта, по более низкой цене за мл, с меньшими заботами о логистике и отходах.</p>
<h2>Часто задаваемые вопросы</h2>
<h3>Отличается ли краска 180 мл по формуле от стандартной?</h3>
<p>Отличается только размер упаковки. Формула Color SHOCK профессиональная, предназначена для работы в салоне — больший объём в упаковке не влияет на качество.</p>
<h3>На сколько окрашиваний хватает одной упаковки 180 мл?</h3>
<p>Зависит от длины волос и техники. Для волос средней длины, при расходе около 60 мл на одно окрашивание, одной упаковки хватает примерно на три окрашивания — втрое больше, чем тюбика 60 мл.</p>
<h3>Сколько салон реально экономит в год?</h3>
<p>Салон, выполняющий 20 окрашиваний в неделю, экономит более 8 000 € в год только на краске (по сравнению со стандартной упаковкой 60 мл стоимостью ~11 €). Точную сумму для своей загрузки рассчитайте в <a href="/ru/skaiciuokle" style="color: var(--magenta); font-weight: 600;">калькуляторе цен</a>.</p>
<h3>Подходит ли большая упаковка для маленького салона или мастера-одиночки?</h3>
<p>Да. Даже при меньшем темпе работы более низкая цена за мл и меньшее число замен тюбиков во время работы остаются выгодными. Больше всего выигрывают те, кто регулярно использует одни и те же оттенки.</p>',

  updated_at = now()
WHERE slug = '180ml-vs-60ml';

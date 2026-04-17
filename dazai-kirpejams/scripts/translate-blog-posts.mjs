/**
 * One-time script: translate blog posts from Lithuanian to English and Russian.
 * Run: node scripts/translate-blog-posts.mjs
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const translations = {
  'kaip-pasirinkti-oksidanta': {
    title_en: 'How to Choose the Right Oxidant',
    title_ru: 'Как выбрать подходящий оксидант',
    excerpt_en: 'The right oxidant is the foundation for a quality colouring result. Learn how to select the concentration based on the desired effect and hair condition.',
    excerpt_ru: 'Правильный оксидант — основа качественного результата окрашивания. Узнайте, как подобрать концентрацию в зависимости от желаемого эффекта и состояния волос.',
    content_en: `<p>The oxidant concentration determines whether the dye only covers or also lightens the hair. The wrong choice means an unpredictable result, dry hair and an unsatisfied client. In this article, we will review when to use 3%, 6%, 9% and 12% oxidant, and how to choose the right concentration based on the client's hair condition.</p>
<h2>3% Oxidant (10 vol.)</h2>
<p>The gentlest concentration, designed for <strong>toning and colour refreshing</strong>. Use it when you want to revive already coloured hair, intensify the shade, or cover individual grey hairs without any lightening effect.</p>
<h2>6% Oxidant (20 vol.)</h2>
<p>A universal concentration. Suitable for <strong>standard tone-on-tone colouring</strong>, grey hair coverage and lightening hair by 1–2 tones. This is the most commonly used oxidant in the salon.</p>
<h2>9% and 12% Oxidant</h2>
<p>Stronger concentrations are used for lightening hair by 2–4 tones or bleaching procedures. Important: the stronger the oxidant, the more attention to hair condition is needed — always assess porosity and elasticity before the procedure.</p>
<h2>Practical Recommendations</h2>
<ul><li>Always perform a strand test before the first colouring</li><li>Use proportions according to the manufacturer's instructions (Color SHOCK — 1:2)</li><li>Do not use old, opened oxidant — it loses its activity</li><li>Store the oxidant in a dark, cool place</li></ul>
<p>The correct oxidant choice is not just about the colouring result, but also about the client's long-term hair health.</p>`,
    content_ru: `<p>Концентрация оксиданта определяет, будет ли краска только покрывать волосы или также осветлять их. Неправильный выбор — это непредсказуемый результат, сухие волосы и недовольный клиент. В этой статье мы рассмотрим, когда использовать 3%, 6%, 9% и 12% оксидант, и как выбрать подходящую концентрацию в зависимости от состояния волос клиента.</p>
<h2>3% оксидант (10 vol.)</h2>
<p>Самая мягкая концентрация, предназначенная для <strong>тонирования и обновления цвета</strong>. Используйте, когда хотите освежить уже окрашенные волосы, усилить оттенок или закрасить единичные седые волосы без эффекта осветления.</p>
<h2>6% оксидант (20 vol.)</h2>
<p>Универсальная концентрация. Подходит для <strong>стандартного окрашивания тон в тон</strong>, закрашивания седины и осветления волос на 1–2 тона. Это наиболее часто используемый оксидант в салоне.</p>
<h2>9% и 12% оксидант</h2>
<p>Более сильные концентрации используются для осветления волос на 2–4 тона или процедур обесцвечивания. Важно: чем сильнее оксидант, тем больше внимания нужно уделять состоянию волос — всегда оценивайте пористость и эластичность перед процедурой.</p>
<h2>Практические рекомендации</h2>
<ul><li>Всегда проводите тест на пряди перед первым окрашиванием</li><li>Используйте пропорции согласно инструкциям производителя (Color SHOCK — 1:2)</li><li>Не используйте старый, открытый оксидант — он теряет активность</li><li>Храните оксидант в тёмном прохладном месте</li></ul>
<p>Правильный выбор оксиданта — это не только результат окрашивания, но и здоровье волос клиента в долгосрочной перспективе.</p>`,
  },

  '180ml-vs-60ml': {
    title_en: '180 ml vs 60 ml: What Is the Difference?',
    title_ru: '180 мл vs 60 мл: в чём разница?',
    excerpt_en: 'A larger package is not just more product. We compared prices, usage efficiency and practical benefits for everyday salon work.',
    excerpt_ru: 'Большая упаковка — это не только больше продукта. Мы сравнили цены, эффективность использования и практическую пользу для ежедневной работы в салоне.',
    content_en: `<p>For a professional hairdresser or colourist, the dye package size is not an aesthetic but an economic question. Every additional package you open per day means additional costs, additional waste and additional time spent managing orders. In this article, we compare the standard 60 ml and Color SHOCK 180 ml packages — with numbers, facts and a practical perspective.</p>
<h2>Standard 60 ml Package</h2>
<p>Most professional hair dye manufacturers in Europe offer 60 ml tube-format packages. This is a long-standing market standard that most specialists are accustomed to. During a single colouring, an average of 60–80 ml of dye mixture (dye + oxidant) is used, which means one package is often used up in a single procedure.</p>
<p>For salons serving dozens of clients daily, this means a large number of packages per month. Each package is a cost, a logistics task and waste. Additionally, the entire volume is not always used precisely: often 5–10 ml of product remains at the bottom of the tube that cannot be used.</p>
<h2>The Color SHOCK 180 ml Advantage</h2>
<p>Color SHOCK professional hair dyes come in <strong>180 ml packages</strong> — three times the volume of the market standard. This solution was designed specifically for professionals who work intensively and daily.</p>
<p>The larger package provides several important advantages:</p>
<ul><li><strong>Lower price per ml</strong> — the larger volume allows for more economical pricing</li><li><strong>Less waste</strong> — one package replaces three standard ones, meaning three times less waste</li><li><strong>More convenient use</strong> — less frequent tube changes during work</li><li><strong>Simpler logistics</strong> — fewer packages to order, store and manage</li><li><strong>Less wasted product</strong> — proportionally less dye remains at the bottom of the tube</li></ul>
<h2>Comparison Table</h2>
<p>Let's look at specific numbers, comparing the standard 60 ml package with Color SHOCK 180 ml:</p>
<table><thead><tr><th>Parameter</th><th>Standard dyes (60 ml)</th><th>Color SHOCK (180 ml)</th></tr></thead><tbody><tr><td>Volume</td><td>60 ml</td><td>180 ml</td></tr><tr><td>Price</td><td>~€5.00</td><td>€7.90</td></tr><tr><td>Price per ml</td><td>~€0.083/ml</td><td>€0.044/ml</td></tr><tr><td>Packages per month (80 colourings)</td><td>~80 units</td><td>~27 units</td></tr><tr><td>Waste per month</td><td>80 tubes</td><td>27 tubes</td></tr></tbody></table>
<blockquote>Price per ml is the most objective way to compare dye value. In the Color SHOCK 180 ml package, one millilitre costs almost half as much as in standard dyes.</blockquote>
<h2>Economic Calculation</h2>
<p>Let's take a specific example. A salon performs <strong>20 colourings per week</strong> (4 colourings per day, 5 working days). An average of 60 ml of dye (without oxidant) is used per colouring.</p>
<h3>With standard 60 ml dyes:</h3>
<ul><li>Per week: 20 packages × €5.00 = <strong>€100.00</strong></li><li>Per month: 80 packages × €5.00 = <strong>€400.00</strong></li><li>Per year: 960 packages × €5.00 = <strong>€4,800.00</strong></li></ul>
<h3>With Color SHOCK 180 ml:</h3>
<ul><li>Per week: ~7 packages × €7.90 = <strong>€55.30</strong></li><li>Per month: ~27 packages × €7.90 = <strong>€213.30</strong></li><li>Per year: ~320 packages × €7.90 = <strong>€2,528.00</strong></li></ul>
<blockquote>Annual savings — more than <strong>€2,200</strong>. This is a significant amount that can be invested in salon expansion, new equipment or staff training.</blockquote>
<h2>Practical Benefits Every Day</h2>
<p>The economic aspect is important, but not the only one. For everyday salon work, the 180 ml package also provides other practical benefits that colleagues rarely discuss.</p>
<p><strong>Fewer orders.</strong> Instead of ordering 80 tubes per month, you order 27. That's less time spent on forming, receiving and storing orders.</p>
<p><strong>More compact storage.</strong> 27 tubes take up significantly less space than 80. The salon workspace remains tidy and clear.</p>
<p><strong>Less waste.</strong> Fewer packages means less plastic waste. If sustainability matters to Your salon, this is a concrete step in that direction.</p>
<p><strong>More convenient work.</strong> One 180 ml package can be used for several colourings in a row, so there is no need to constantly open new tubes. The workflow becomes smoother and faster.</p>
<h2>Conclusion</h2>
<p>Package size is not a minor detail. It is a decision that affects Your salon's profitability, work convenience and cost control every day. The Color SHOCK 180 ml package was designed precisely for this — to give the professional more product, at a lower price per ml, with fewer worries about logistics and waste.</p>`,
    content_ru: `<p>Для профессионального парикмахера или колориста размер упаковки краски — это не эстетический, а экономический вопрос. Каждая дополнительная упаковка, которую вы открываете за день, — это дополнительные расходы, дополнительные отходы и дополнительное время на управление заказами. В этой статье мы сравним стандартную упаковку 60 мл и Color SHOCK 180 мл — цифрами, фактами и с практической точки зрения.</p>
<h2>Стандартная упаковка 60 мл</h2>
<p>Большинство европейских производителей профессиональных красок для волос предлагают упаковки в формате тюбика 60 мл. Это давний рыночный стандарт, к которому привыкло большинство специалистов. За одно окрашивание в среднем расходуется 60–80 мл красящей смеси (краска + оксидант), а это значит, что одна упаковка часто расходуется за одну процедуру.</p>
<p>Для салонов, обслуживающих десятки клиентов ежедневно, это означает большое количество упаковок в месяц. Каждая упаковка — это и стоимость, и логистика, и отходы. К тому же не всегда весь объём используется точно: часто на дне тюбика остаётся 5–10 мл продукта, который уже невозможно использовать.</p>
<h2>Преимущество Color SHOCK 180 мл</h2>
<p>Профессиональные краски для волос Color SHOCK выпускаются в <strong>упаковках 180 мл</strong> — это втрое больший объём по сравнению с рыночным стандартом. Это решение было создано именно для профессионалов, работающих интенсивно и ежедневно.</p>
<p>Увеличенная упаковка даёт ряд важных преимуществ:</p>
<ul><li><strong>Ниже цена за мл</strong> — больший объём позволяет применять более экономичное ценообразование</li><li><strong>Меньше отходов</strong> — одна упаковка заменяет три стандартных, а значит, втрое меньше отходов</li><li><strong>Удобнее в использовании</strong> — реже нужно менять тюбики во время работы</li><li><strong>Проще логистика</strong> — меньше упаковок заказывать, хранить и обрабатывать</li><li><strong>Меньше потерь продукта</strong> — процентно меньше краски остаётся на дне тюбика</li></ul>
<h2>Сравнительная таблица</h2>
<p>Посмотрим на конкретные цифры, сравнивая стандартную упаковку 60 мл с Color SHOCK 180 мл:</p>
<table><thead><tr><th>Параметр</th><th>Стандартные краски (60 мл)</th><th>Color SHOCK (180 мл)</th></tr></thead><tbody><tr><td>Объём</td><td>60 мл</td><td>180 мл</td></tr><tr><td>Цена</td><td>~5,00 €</td><td>7,90 €</td></tr><tr><td>Цена за мл</td><td>~0,083 €/мл</td><td>0,044 €/мл</td></tr><tr><td>Упаковок в месяц (80 окрашиваний)</td><td>~80 шт.</td><td>~27 шт.</td></tr><tr><td>Отходы за месяц</td><td>80 тюбиков</td><td>27 тюбиков</td></tr></tbody></table>
<blockquote>Цена за мл — самый объективный способ сравнить ценность краски. В упаковке Color SHOCK 180 мл один миллилитр стоит почти вдвое дешевле, чем в стандартных красках.</blockquote>
<h2>Экономический расчёт</h2>
<p>Возьмём конкретный пример. Салон выполняет <strong>20 окрашиваний в неделю</strong> (4 окрашивания в день, 5 рабочих дней). На каждое окрашивание в среднем расходуется 60 мл краски (без оксиданта).</p>
<h3>Со стандартными красками 60 мл:</h3>
<ul><li>В неделю: 20 упаковок × 5,00 € = <strong>100,00 €</strong></li><li>В месяц: 80 упаковок × 5,00 € = <strong>400,00 €</strong></li><li>В год: 960 упаковок × 5,00 € = <strong>4 800,00 €</strong></li></ul>
<h3>С Color SHOCK 180 мл:</h3>
<ul><li>В неделю: ~7 упаковок × 7,90 € = <strong>55,30 €</strong></li><li>В месяц: ~27 упаковок × 7,90 € = <strong>213,30 €</strong></li><li>В год: ~320 упаковок × 7,90 € = <strong>2 528,00 €</strong></li></ul>
<blockquote>Годовая экономия — более <strong>2 200 €</strong>. Это значительная сумма, которую можно инвестировать в развитие салона, новое оборудование или обучение персонала.</blockquote>
<h2>Практическая польза каждый день</h2>
<p>Экономический аспект важен, но не единственен. Для ежедневной работы в салоне упаковка 180 мл даёт и другую практическую пользу, о которой коллеги редко говорят.</p>
<p><strong>Меньше заказов.</strong> Вместо заказа 80 тюбиков в месяц вы заказываете 27. Это меньше времени на формирование, приём и хранение заказов.</p>
<p><strong>Компактное хранение.</strong> 27 тюбиков занимают значительно меньше места, чем 80. Рабочее пространство салона остаётся аккуратным и свободным.</p>
<p><strong>Меньше отходов.</strong> Меньше упаковок — меньше пластиковых отходов. Если для Вашего салона важен аспект экологичности, это конкретный шаг в этом направлении.</p>
<p><strong>Удобнее работать.</strong> Одну упаковку 180 мл можно использовать для нескольких окрашиваний подряд, поэтому не нужно постоянно открывать новые тюбики. Рабочий процесс становится плавнее и быстрее.</p>
<h2>Вывод</h2>
<p>Размер упаковки — это не мелочь. Это решение, которое каждый день влияет на прибыльность Вашего салона, удобство работы и контроль расходов. Упаковка Color SHOCK 180 мл создана именно для этого — дать профессионалу больше продукта, по более низкой цене за мл, с меньшими заботами о логистике и отходах.</p>`,
  },

  'dazymo-technikos': {
    title_en: 'Colouring Techniques for Professionals',
    title_ru: 'Техники окрашивания для профессионалов',
    excerpt_en: 'Balayage, ombré, layering technique — we review the most popular colouring techniques and advise how to achieve the best results.',
    excerpt_ru: 'Балаяж, омбре, послойная техника — обзор самых популярных техник окрашивания и советы по достижению лучших результатов.',
    content_en: `<p>Modern colourisation is no longer just "single colour" dyeing. Clients increasingly arrive with specific ideas from social media — balayage, ombré, money piece, foilayage. In this article, we will review the most popular techniques and provide practical tips on how to perform them professionally.</p>
<h2>Balayage</h2>
<p>A technique of French origin that became the new "gold standard" in the 2010s. Dye is applied by hand, without foil, creating natural sun-kissed transition effects. Suitable for almost all hair types, especially for those who want a low-maintenance result.</p>
<h2>Ombré and Sombré</h2>
<p>A clear transition from dark roots to light ends. <strong>Sombré</strong> is a softer, more subtle version of ombré. Choose sombré for clients who want a change but not too drastic.</p>
<h2>Foilayage</h2>
<p>A hybrid technique — a balayage result, but with foil assistance for more intensive lightening. Suitable for brunettes who want a vivid balayage effect.</p>
<h2>Money Piece</h2>
<p>Brightly lightened individual strands at the face line. A quick procedure with great visual impact. An excellent option between two major colourings.</p>
<h2>What to Choose for Each Case</h2>
<ul><li>For a natural effect with minimal maintenance — <strong>balayage</strong></li><li>For a vivid contrast — <strong>ombré</strong> or <strong>foilayage</strong></li><li>For a quick change between colourings — <strong>money piece</strong></li><li>For a first decision about lightening — <strong>sombré</strong></li></ul>`,
    content_ru: `<p>Современная колористика — это уже далеко не просто окрашивание «в один цвет». Клиенты всё чаще приходят с конкретными идеями из социальных сетей — балаяж, омбре, money piece, фойлаяж. В этой статье мы рассмотрим самые популярные техники и дадим практические советы по их профессиональному выполнению.</p>
<h2>Балаяж</h2>
<p>Техника французского происхождения, ставшая новым «золотым стандартом» в 2010-х годах. Краска наносится рукой, без фольги, создавая естественные переходы с эффектом выгоревших на солнце волос. Подходит практически для всех типов волос, особенно для тех, кто хочет результат, не требующий частого ухода.</p>
<h2>Омбре и Сомбре</h2>
<p>Чёткий переход от тёмных корней к светлым кончикам. <strong>Сомбре</strong> — более мягкая, утончённая версия омбре. Выбирайте сомбре для клиенток, которые хотят перемен, но не слишком кардинальных.</p>
<h2>Фойлаяж</h2>
<p>Гибридная техника — результат балаяжа, но с помощью фольги достигается более интенсивное осветление. Подходит брюнеткам, желающим яркого эффекта балаяжа.</p>
<h2>Money Piece</h2>
<p>Ярко осветлённые отдельные пряди по линии лица. Быстрая процедура с большим визуальным эффектом. Отличный вариант между двумя крупными окрашиваниями.</p>
<h2>Что выбрать в каждом случае</h2>
<ul><li>Для естественного эффекта с минимальным уходом — <strong>балаяж</strong></li><li>Для яркого контраста — <strong>омбре</strong> или <strong>фойлаяж</strong></li><li>Для быстрого изменения между окрашиваниями — <strong>money piece</strong></li><li>Для первого решения об осветлении — <strong>сомбре</strong></li></ul>`,
  },

  'spalvu-tendencijos-2026': {
    title_en: 'Colour Trends for 2026',
    title_ru: 'Цветовые тенденции 2026 года',
    excerpt_en: 'Which shades will dominate this season? We review the most popular tones and provide Color SHOCK colour recommendations for Your clients.',
    excerpt_ru: 'Какие оттенки будут доминировать в этом сезоне? Обзор самых популярных тонов и рекомендации по цветам Color SHOCK для Ваших клиентов.',
    content_en: `<p>2026 is returning to naturalism, but with character. Trends seen at international beauty weeks show a clear direction: <strong>warm, rich, "autumnal" tones</strong> and layered colourisation that emphasises hair texture.</p>
<h2>1. Expensive Brunette</h2>
<p>A deep brown base with warm caramel and honey highlights. It's not dark, it's <em>expensive</em>. Ideal for working women who want an ambitious yet professional look.</p>
<h2>2. Copper Glow</h2>
<p>Copper tones are becoming the dominant vivid colour. From subtle copper-red to bold pumpkin spice — clients are increasingly choosing warm, fiery tones.</p>
<h2>3. Cool Vanilla Blonde</h2>
<p>An evolution of the classic cool blonde — with vanilla, sand and milk pearl highlights. Less white, more rich warmth.</p>
<h2>4. Chocolate Cherry</h2>
<p>A fusion of chocolate brown and dark cherry. Suitable for clients seeking boldness but not wanting to stray too far from their natural tone.</p>
<p>All these trends are easily achievable with Color SHOCK palette rows 4, 5, 6, 7 and 8 shades. The key is the right oxidant and the correct exposure time.</p>`,
    content_ru: `<p>2026 год возвращается к натуральности, но с характером. Тенденции, которые мы наблюдаем на международных неделях красоты, показывают чёткое направление: <strong>тёплые, насыщенные, «осенние» тона</strong> и многослойная колористика, подчёркивающая текстуру волос.</p>
<h2>1. Expensive Brunette</h2>
<p>Глубокая коричневая база с тёплыми карамельными и медовыми бликами. Это не тёмно, это <em>дорого</em>. Идеально для деловых женщин, которые хотят амбициозного, но профессионального образа.</p>
<h2>2. Copper Glow</h2>
<p>Медный оттенок становится доминирующим ярким цветом. От утончённого медно-рыжего до смелого pumpkin spice — клиентки всё смелее выбирают тёплые, огненные тона.</p>
<h2>3. Cool Vanilla Blonde</h2>
<p>Эволюция классического холодного блонда — с ванильными, песочными и молочно-жемчужными бликами. Меньше белого, больше насыщенного тепла.</p>
<h2>4. Chocolate Cherry</h2>
<p>Слияние шоколадно-коричневого и тёмной вишни. Подходит клиенткам, которые ищут смелости, но не хотят слишком отдаляться от натурального тона.</p>
<p>Все эти тенденции легко достижимы с оттенками 4, 5, 6, 7 и 8 рядов палитры Color SHOCK. Главное — правильный оксидант и подходящее время экспозиции.</p>`,
  },

  'sumazinti-sanaudas': {
    title_en: 'How to Reduce Dye Costs in the Salon',
    title_ru: 'Как снизить расход краски в салоне',
    excerpt_en: 'Practical tips on how to optimise dye usage and reduce costs without sacrificing colouring quality. We calculate real savings.',
    excerpt_ru: 'Практические советы по оптимизации расхода краски и снижению затрат без потери качества окрашивания. Рассчитываем реальную экономию.',
    content_en: `<p>Dye costs are usually the second largest variable expense in a salon after rent. Even a small optimisation can yield four-figure savings over a year. In this article — concrete steps to reduce costs without compromising quality.</p>
<h2>1. Precise Dye Weighing</h2>
<p>Scales cost €15–30 and pay for themselves from the first week. Instead of squeezing "by eye" from the tube — precise weighing of 30, 45, 60 g. Result: no more "over-mixed" mixture that ends up in the bin.</p>
<h2>2. Larger Package = Lower Price per ml</h2>
<p>As we discussed in a <a href="/en/blogas/180ml-vs-60ml" style="color: var(--magenta); font-weight: 600;">previous article</a>, the price per ml in a 180 ml package is almost twice lower than in standard 60 ml packages. If you haven't switched yet — calculate your annual savings with the calculator.</p>
<h2>3. Standardised Protocols by Hair Length</h2>
<p>Create an internal document: <strong>short hair — 30 g, medium — 45 g, long — 60–80 g</strong>. When the entire team works with the same measurements, costs become predictable and economies of scale kick in when buying wholesale.</p>
<h2>4. FIFO Stock Rotation</h2>
<p>First In, First Out — the tubes delivered first are used first. This prevents write-offs due to expired shelf life. Mark packages with the delivery date.</p>
<h2>5. Combine Procedures</h2>
<p>If two similar-tone colourings are scheduled for the day — mix a slightly larger batch and perform both procedures consecutively. You'll save both dye and time.</p>
<h2>Expected Results</h2>
<p>By applying these 5 principles, an average salon can reduce dye costs by <strong>15–25%</strong> within the first 3 months. If you currently spend €400 per month on dyes, that's €60–100 per month, or €720–1,200 per year.</p>`,
    content_ru: `<p>Расходы на краску — обычно вторая по величине переменная статья расходов салона после аренды. Даже небольшая оптимизация за год может дать четырёхзначную экономию. В этой статье — конкретные шаги по снижению затрат без ущерба качеству.</p>
<h2>1. Точное взвешивание краски</h2>
<p>Весы стоят 15–30 €, а окупаются с первой недели. Вместо выдавливания «на глаз» из тюбика — точное взвешивание 30, 45, 60 г. Результат: больше не остаётся «перемешанной лишней» смеси, которая отправляется в мусор.</p>
<h2>2. Большая упаковка = ниже цена за мл</h2>
<p>Как мы рассматривали в <a href="/ru/blogas/180ml-vs-60ml" style="color: var(--magenta); font-weight: 600;">предыдущей статье</a>, цена за мл в упаковке 180 мл почти вдвое ниже, чем в стандартных 60 мл. Если вы ещё не перешли — рассчитайте годовую экономию в калькуляторе.</p>
<h2>3. Стандартизированные протоколы по длине волос</h2>
<p>Создайте внутренний документ: <strong>короткие волосы — 30 г, средние — 45 г, длинные — 60–80 г</strong>. Когда вся команда работает по одинаковым нормам, расходы становятся прогнозируемыми, а при оптовых закупках включается эффект масштаба.</p>
<h2>4. Ротация запасов по принципу FIFO</h2>
<p>First In, First Out — тюбики, привезённые первыми, используются первыми. Так вы избежите списания из-за истёкшего срока годности. Маркируйте упаковки датой доставки.</p>
<h2>5. Комбинируйте процедуры</h2>
<p>Если на день запланировано два окрашивания в похожем тоне — замешайте чуть больший объём и выполните обе процедуры подряд. Сэкономите и краску, и время.</p>
<h2>Ожидаемый результат</h2>
<p>Применяя эти 5 принципов, средний салон может снизить расходы на краску на <strong>15–25%</strong> за первые 3 месяца. Если сейчас вы тратите на краски 400 € в месяц, это 60–100 € ежемесячно, или 720–1 200 € в год.</p>`,
  },

  'prieziura-po-dazymo': {
    title_en: 'Hair Care After Colouring',
    title_ru: 'Уход за волосами после окрашивания',
    excerpt_en: 'What to recommend to the client after colouring? We discuss effective care products and tips that extend colour longevity.',
    excerpt_ru: 'Что порекомендовать клиенту после окрашивания? Обсуждаем эффективные средства ухода и советы, которые продлевают стойкость цвета.',
    content_en: `<p>Colouring doesn't end when the client leaves the salon — that's when the most important phase begins: the first 72 hours. What should you recommend to the client so that the colour lasts longer and the hair stays healthy?</p>
<h2>The First 72 Hours</h2>
<ul><li>Do not wash hair for 48–72 hours after colouring — colour molecules are still "setting"</li><li>Avoid hot water — warm or lukewarm is best</li><li>Do not use a straightener at high temperatures</li><li>Protect hair from direct sunlight</li></ul>
<h2>Daily Care Protocol</h2>
<p>Recommend the client a <strong>sulphate-free and silicone-free shampoo</strong> designed for coloured hair. Sulphates wash out colour within a few washes, while silicones prevent masks from penetrating the hair structure.</p>
<h2>Deep Care</h2>
<p>At least once a week — a nourishing mask for 10–20 minutes. Masks containing argan oil, keratin and panthenol restore hair structure and help the colour last.</p>
<h2>Every 4–6 Weeks — at the Salon</h2>
<p>A gloss or toner procedure extends colour longevity. It's a 20-minute procedure that restores colour to its original intensity, and the client feels that the salon cares about the result long-term — not just for one day.</p>`,
    content_ru: `<p>Окрашивание заканчивается не тогда, когда клиентка выходит из салона — именно тогда начинается самая важная фаза: первые 72 часа. Что рекомендовать клиентке, чтобы цвет держался дольше, а волосы оставались здоровыми?</p>
<h2>Первые 72 часа</h2>
<ul><li>Не мыть волосы 48–72 часа после окрашивания — молекулы цвета ещё «фиксируются»</li><li>Избегать горячей воды — тёплая или чуть прохладная подходит лучше всего</li><li>Не использовать утюжок на высокой температуре</li><li>Защищать волосы от прямых солнечных лучей</li></ul>
<h2>Ежедневный протокол ухода</h2>
<p>Рекомендуйте клиентке <strong>бессульфатный шампунь без силиконов</strong>, предназначенный для окрашенных волос. Сульфаты вымывают цвет за несколько помывок, а силиконы не позволяют маске проникать в структуру волоса.</p>
<h2>Глубокий уход</h2>
<p>Минимум раз в неделю — питательная маска на 10–20 минут. Маски с аргановым маслом, кератином и пантенолом восстанавливают структуру волоса и помогают цвету дольше держаться.</p>
<h2>Каждые 4–6 недель — в салоне</h2>
<p>Процедура глосса или тонирования продлевает жизнь цвета. Это 20-минутная процедура, благодаря которой цвет возвращается к исходной интенсивности, а клиентка чувствует, что салон заботится о результате в долгосрочной перспективе — не только один день.</p>`,
  },
}

async function main() {
  for (const [slug, tr] of Object.entries(translations)) {
    console.log(`Updating ${slug}...`)
    const { error } = await sb
      .from('blog_posts')
      .update({
        title_en: tr.title_en,
        title_ru: tr.title_ru,
        excerpt_en: tr.excerpt_en,
        excerpt_ru: tr.excerpt_ru,
        content_en: tr.content_en,
        content_ru: tr.content_ru,
      })
      .eq('slug', slug)

    if (error) {
      console.error(`  ERROR: ${error.message}`)
    } else {
      console.log(`  OK`)
    }
  }
  console.log('\nDone! All 6 posts translated.')
}

main()

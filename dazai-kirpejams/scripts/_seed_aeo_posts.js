/* eslint-disable */
// Vienkartinis AEO blogo įrašų seed'as. Paleisti: node scripts/_seed_aeo_posts.js
// Idempotentinis: upsert pagal slug. NEKOMITINAMAS (scripts/ gitignored).
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const NOW = new Date().toISOString()
const AUTHOR = 'Džiuljeta Vėbrė'

// ---------- #1 Vieno dažymo savikaina ----------
const savikaina = {
  slug: 'vieno-dazymo-savikaina',
  category: 'patarimai',
  title_lt: 'Kiek kainuoja vieno dažymo savikaina salone?',
  title_en: 'What does the dye cost of one coloring in a salon?',
  title_ru: 'Сколько стоит себестоимость одного окрашивания в салоне?',
  excerpt_lt: 'Tikslus skaičiavimas: vieno dažymo dažų savikaina su Color SHOCK 180 ml — apie €2,63, t. y. ~76 % mažiau nei su standartine 60 ml pakuote.',
  excerpt_en: 'A precise calculation: the dye cost of one coloring with Color SHOCK 180 ml is about €2.63 — roughly 76% less than a standard 60 ml pack.',
  excerpt_ru: 'Точный расчёт: себестоимость краски на одно окрашивание с Color SHOCK 180 мл — около €2,63, примерно на 76% меньше, чем со стандартной упаковкой 60 мл.',
  content_lt: `<p><strong>Vieno dažymo dažų savikaina su Color SHOCK yra apie €2,63</strong>, kai vienam dažymui sunaudojama maždaug 60 ml dažų. Color SHOCK 180 ml pakuotė kainuoja <strong>€7,90</strong> — tai <strong>€0,044 už mililitrą</strong>, arba apie <strong>3 dažymai iš vienos pakuotės</strong>. Standartinė rinkos 60 ml profesionalių dažų pakuotė kainuoja apie €11 (€0,183/ml), tad vienam dažymui išleidžiama visa pakuotė. Skirtumas — apie <strong>€8 kiekvienam dažymui</strong>, t. y. dažų savikaina maždaug <strong>76 % mažesnė</strong>.</p>
<h2>Kaip apskaičiuojama savikaina</h2>
<p>Formulė paprasta: pakuotės kaina padalinama iš talpos (gaunama kaina už mililitrą), tada padauginama iš vienam dažymui sunaudojamo kiekio.</p>
<ul>
<li><strong>Color SHOCK 180 ml:</strong> €7,90 ÷ 180 ml = €0,044/ml → 60 ml × €0,044 = <strong>€2,63 vienam dažymui</strong></li>
<li><strong>Standartinė 60 ml (~€11):</strong> €11 ÷ 60 ml = €0,183/ml → 60 ml × €0,183 = <strong>€11 vienam dažymui</strong></li>
</ul>
<h2>Pavyzdys salonui</h2>
<p>Jei salone atliekama apie 60 dažymų per mėnesį, dažų savikaina su Color SHOCK siektų ~€158, o su standartine 60 ml pakuote ~€660. Tikslų jūsų salono rezultatą pateikia mūsų <a href="/skaiciuokle">kainų skaičiuoklė</a>.</p>
<h2>Kodėl 180 ml keičia ekonomiką</h2>
<p>Didesnė pakuotė reiškia mažesnę kainą už mililitrą, mažiau atidaromų pakuočių per dieną ir mažiau atliekų. Tai ne estetinis, o grynai ekonominis pranašumas salonui, dirbančiam kasdien.</p>
<h2>Dažni klausimai</h2>
<h3>Kiek dažymų gaunasi iš 180 ml pakuotės?</h3>
<p>Apie 3 dažymus, kai vienam dažymui imama ~60 ml dažų. Tikslus skaičius priklauso nuo plaukų ilgio ir tankio.</p>
<h3>Kiek kainuoja vienas dažymas su Color SHOCK?</h3>
<p>Apie €2,63 dažų savikainos (60 ml × €0,044/ml). Tam pačiam dažymui standartinė 60 ml pakuotė kainuotų apie €11.</p>
<h3>Ar į savikainą įskaičiuotas oksidantas?</h3>
<p>Ne. Čia pateikta tik dažų savikaina. Oksidanto sąnaudas pridėkite atskirai pagal naudojamą maišymo santykį 1:2.</p>`,
  content_en: `<p><strong>The dye cost of one coloring with Color SHOCK is about €2.63</strong> when roughly 60 ml of dye is used per service. A Color SHOCK 180 ml pack costs <strong>€7.90</strong> — that is <strong>€0.044 per millilitre</strong>, or about <strong>3 colorings per pack</strong>. A standard 60 ml professional pack costs around €11 (€0.183/ml), so one coloring uses up the whole pack. The difference is about <strong>€8 per coloring</strong> — roughly <strong>76% lower</strong> dye cost.</p>
<h2>How the cost is calculated</h2>
<p>The formula is simple: divide the pack price by its volume (price per millilitre), then multiply by the amount used per coloring.</p>
<ul>
<li><strong>Color SHOCK 180 ml:</strong> €7.90 ÷ 180 ml = €0.044/ml → 60 ml × €0.044 = <strong>€2.63 per coloring</strong></li>
<li><strong>Standard 60 ml (~€11):</strong> €11 ÷ 60 ml = €0.183/ml → 60 ml × €0.183 = <strong>€11 per coloring</strong></li>
</ul>
<h2>Example for a salon</h2>
<p>At about 60 colorings per month, the dye cost with Color SHOCK would be ~€158 versus ~€660 with a standard 60 ml pack. Get your salon's exact figure with our <a href="/en/skaiciuokle">price calculator</a>.</p>
<h2>Why 180 ml changes the economics</h2>
<p>A larger pack means a lower price per millilitre, fewer packs opened per day and less waste. It is not an aesthetic but a purely economic advantage for a salon working every day.</p>
<h2>Frequently Asked Questions</h2>
<h3>How many colorings does a 180 ml pack give?</h3>
<p>About 3 colorings when ~60 ml of dye is used per service. The exact number depends on hair length and density.</p>
<h3>How much does one coloring cost with Color SHOCK?</h3>
<p>About €2.63 in dye cost (60 ml × €0.044/ml). A standard 60 ml pack would cost about €11 for the same coloring.</p>
<h3>Does the cost include the developer?</h3>
<p>No. This is the dye cost only. Add the developer separately according to the 1:2 mixing ratio.</p>`,
  content_ru: `<p><strong>Себестоимость краски на одно окрашивание с Color SHOCK — около €2,63</strong>, когда на услугу расходуется примерно 60 мл краски. Упаковка Color SHOCK 180 мл стоит <strong>€7,90</strong> — это <strong>€0,044 за миллилитр</strong>, или около <strong>3 окрашиваний из одной упаковки</strong>. Стандартная упаковка 60 мл стоит около €11 (€0,183/мл), поэтому на одно окрашивание уходит вся упаковка. Разница — около <strong>€8 на каждое окрашивание</strong>, то есть себестоимость краски примерно на <strong>76% ниже</strong>.</p>
<h2>Как рассчитывается себестоимость</h2>
<p>Формула проста: цена упаковки делится на объём (цена за миллилитр), затем умножается на расход на одно окрашивание.</p>
<ul>
<li><strong>Color SHOCK 180 мл:</strong> €7,90 ÷ 180 мл = €0,044/мл → 60 мл × €0,044 = <strong>€2,63 за окрашивание</strong></li>
<li><strong>Стандарт 60 мл (~€11):</strong> €11 ÷ 60 мл = €0,183/мл → 60 мл × €0,183 = <strong>€11 за окрашивание</strong></li>
</ul>
<h2>Пример для салона</h2>
<p>При ~60 окрашиваниях в месяц себестоимость краски с Color SHOCK составит ~€158 против ~€660 со стандартной упаковкой 60 мл. Точный результат для вашего салона покажет наш <a href="/ru/skaiciuokle">калькулятор цен</a>.</p>
<h2>Почему 180 мл меняет экономику</h2>
<p>Бóльшая упаковка — это меньшая цена за миллилитр, меньше вскрытых упаковок в день и меньше отходов. Это не эстетическое, а чисто экономическое преимущество для салона, работающего ежедневно.</p>
<h2>Часто задаваемые вопросы</h2>
<h3>Сколько окрашиваний выходит из упаковки 180 мл?</h3>
<p>Около 3 окрашиваний при расходе ~60 мл краски на услугу. Точное число зависит от длины и густоты волос.</p>
<h3>Сколько стоит одно окрашивание с Color SHOCK?</h3>
<p>Около €2,63 себестоимости краски (60 мл × €0,044/мл). Стандартная упаковка 60 мл стоила бы около €11.</p>
<h3>Входит ли в себестоимость окислитель?</h3>
<p>Нет. Здесь указана только себестоимость краски. Окислитель добавляйте отдельно по пропорции 1:2.</p>`,
}

// ---------- #3 Kaip maišyti dažus su oksidantu ----------
const maisymas = {
  slug: 'kaip-maisyti-dazus-su-oksidantu',
  category: 'patarimai',
  title_lt: 'Kaip teisingai maišyti dažus su oksidantu?',
  title_en: 'How to mix hair dye with developer correctly?',
  title_ru: 'Как правильно смешивать краску с окислителем?',
  excerpt_lt: 'Color SHOCK dažai maišomi su oksidantu santykiu 1:2. Kaip parinkti oksidanto stiprumą (10/20/30 vol) ir nesuklysti.',
  excerpt_en: 'Color SHOCK dye is mixed with developer at a 1:2 ratio. How to choose the developer strength (10/20/30 vol) and avoid mistakes.',
  excerpt_ru: 'Краска Color SHOCK смешивается с окислителем в пропорции 1:2. Как выбрать силу окислителя (10/20/30 vol) и не ошибиться.',
  content_lt: `<p><strong>Color SHOCK profesionalūs dažai maišomi su oksidantu santykiu 1:2</strong> — vienai daliai dažų imamos dvi dalys oksidanto (pvz. 60 g dažų + 120 ml oksidanto). Oksidanto stiprumas parenkamas pagal tikslą: <strong>10 vol (3 %)</strong> — tonas į toną ir žilų dengimui, <strong>20 vol (6 %)</strong> — 1–2 tonų šviesinimui ir patikimam žilų dengimui, <strong>30 vol (9 %)</strong> — 2–3 tonų šviesinimui. Mišinį maišykite tik nemetaliniame inde ir naudokite iš karto.</p>
<h2>Maišymo santykis</h2>
<p>Standartinis Color SHOCK santykis — <strong>1:2</strong>. Pavyzdžiui: 60 g dažų + 120 ml oksidanto. Tikslų kiekį visada matuokite svarstyklėmis arba matuokliu — „iš akies" maišymas duoda nestabilų rezultatą.</p>
<h2>Kaip parinkti oksidanto stiprumą</h2>
<ul>
<li><strong>10 vol (3 %)</strong> — tonas į toną, tamsinimas, žilų dengimas be šviesinimo.</li>
<li><strong>20 vol (6 %)</strong> — 1–2 tonų šviesinimas, dažniausiai naudojamas variantas, patikimas žilų dengimas.</li>
<li><strong>30 vol (9 %)</strong> — 2–3 tonų šviesinimas.</li>
</ul>
<h2>Žingsniai</h2>
<p>Pasverkite dažus, pridėkite oksidantą santykiu 1:2, maišykite iki vientisos masės, tepkite tolygiai, laikykite pagal instrukciją (paprastai 30–45 min.), kontroliuokite vizualiai.</p>
<h2>Dažnos klaidos</h2>
<p>Per stiprus oksidantas žilų dengimui, netikslus santykis, pakartotinis seno mišinio naudojimas — visa tai blogina rezultatą ir tvarumą.</p>
<h2>Dažni klausimai</h2>
<h3>Koks Color SHOCK maišymo santykis su oksidantu?</h3>
<p>1:2 — viena dalis dažų ir dvi dalys oksidanto.</p>
<h3>Kokį oksidantą rinktis žilų dengimui?</h3>
<p>Dažniausiai 20 vol (6 %) — jis patikimai padengia žilus plaukus tonas į toną.</p>
<h3>Ar galima maišyti skirtingas Color SHOCK spalvas?</h3>
<p>Taip, spalvas tarpusavyje maišyti galima; oksidantas pridedamas pagal bendrą dažų kiekį santykiu 1:2.</p>`,
  content_en: `<p><strong>Color SHOCK professional dye is mixed with developer at a 1:2 ratio</strong> — two parts developer to one part dye (e.g. 60 g dye + 120 ml developer). Choose the developer strength by goal: <strong>10 vol (3%)</strong> for tone-on-tone and grey coverage, <strong>20 vol (6%)</strong> for 1–2 levels of lift and reliable grey coverage, <strong>30 vol (9%)</strong> for 2–3 levels of lift. Mix only in a non-metallic bowl and use immediately.</p>
<h2>Mixing ratio</h2>
<p>The standard Color SHOCK ratio is <strong>1:2</strong>. For example: 60 g dye + 120 ml developer. Always measure with a scale or measuring cup — mixing by eye gives unstable results.</p>
<h2>Choosing developer strength</h2>
<ul>
<li><strong>10 vol (3%)</strong> — tone-on-tone, going darker, grey coverage without lift.</li>
<li><strong>20 vol (6%)</strong> — 1–2 levels of lift, the most common choice, reliable grey coverage.</li>
<li><strong>30 vol (9%)</strong> — 2–3 levels of lift.</li>
</ul>
<h2>Steps</h2>
<p>Weigh the dye, add developer at 1:2, mix to a smooth cream, apply evenly, process per instructions (usually 30–45 min) and monitor visually.</p>
<h2>Common mistakes</h2>
<p>Too strong a developer for grey coverage, an inaccurate ratio, or reusing old mixture all harm the result and longevity.</p>
<h2>Frequently Asked Questions</h2>
<h3>What is the Color SHOCK mixing ratio with developer?</h3>
<p>1:2 — one part dye to two parts developer.</p>
<h3>Which developer for grey coverage?</h3>
<p>Usually 20 vol (6%) — it reliably covers grey hair tone-on-tone.</p>
<h3>Can different Color SHOCK shades be mixed?</h3>
<p>Yes, shades can be intermixed; developer is added to the total dye amount at 1:2.</p>`,
  content_ru: `<p><strong>Профессиональная краска Color SHOCK смешивается с окислителем в пропорции 1:2</strong> — две части окислителя на одну часть краски (например, 60 г краски + 120 мл окислителя). Силу окислителя выбирайте по цели: <strong>10 vol (3%)</strong> — тон в тон и закрашивание седины, <strong>20 vol (6%)</strong> — осветление на 1–2 тона и надёжное закрашивание седины, <strong>30 vol (9%)</strong> — осветление на 2–3 тона. Смешивайте только в неметаллической ёмкости и используйте сразу.</p>
<h2>Пропорция смешивания</h2>
<p>Стандартная пропорция Color SHOCK — <strong>1:2</strong>. Например: 60 г краски + 120 мл окислителя. Всегда отмеряйте весами или мерным стаканом — смешивание «на глаз» даёт нестабильный результат.</p>
<h2>Как выбрать силу окислителя</h2>
<ul>
<li><strong>10 vol (3%)</strong> — тон в тон, затемнение, закрашивание седины без осветления.</li>
<li><strong>20 vol (6%)</strong> — осветление на 1–2 тона, самый частый вариант, надёжное закрашивание седины.</li>
<li><strong>30 vol (9%)</strong> — осветление на 2–3 тона.</li>
</ul>
<h2>Шаги</h2>
<p>Взвесьте краску, добавьте окислитель 1:2, размешайте до однородности, нанесите равномерно, выдержите по инструкции (обычно 30–45 мин) и контролируйте визуально.</p>
<h2>Частые ошибки</h2>
<p>Слишком сильный окислитель для седины, неточная пропорция, повторное использование старой смеси — всё это ухудшает результат и стойкость.</p>
<h2>Часто задаваемые вопросы</h2>
<h3>Какая пропорция смешивания Color SHOCK с окислителем?</h3>
<p>1:2 — одна часть краски и две части окислителя.</p>
<h3>Какой окислитель выбрать для седины?</h3>
<p>Обычно 20 vol (6%) — он надёжно закрашивает седину тон в тон.</p>
<h3>Можно ли смешивать разные оттенки Color SHOCK?</h3>
<p>Да, оттенки можно смешивать между собой; окислитель добавляется к общему количеству краски в пропорции 1:2.</p>`,
}

// ---------- #4 Pradedančiam koloristui ----------
const pradedanciam = {
  slug: 'dazai-pradedanciam-koloristui',
  category: 'patarimai',
  title_lt: 'Kokius dažus rinktis pradedančiam koloristui?',
  title_en: 'Which hair dyes should a beginner colorist choose?',
  title_ru: 'Какую краску выбрать начинающему колористу?',
  excerpt_lt: 'Pradedančiajam užtenka bazinės natūralių (.0) ir pelenų (.1) tonų paletės bei oksidantų rinkinio (10/20/30 vol). Kodėl 180 ml pakuotė tinka praktikai.',
  excerpt_en: 'A beginner needs a base palette of natural (.0) and ash (.1) tones plus a developer set (10/20/30 vol). Why the 180 ml pack suits practice.',
  excerpt_ru: 'Новичку достаточно базовой палитры натуральных (.0) и пепельных (.1) тонов и набора окислителей (10/20/30 vol). Почему упаковка 180 мл подходит для практики.',
  content_lt: `<p><strong>Pradedančiam koloristui rekomenduojama pradėti nuo bazinės natūralių tonų (.0) paletės, kelių pelenų (.1) atspalvių geltonumui neutralizuoti ir oksidantų rinkinio (10, 20 ir 30 vol).</strong> Color SHOCK 180 ml pakuotės (nuo €7,90, €0,044/ml) leidžia praktikuotis pigiau — mažesnė vieno dažymo savikaina reiškia, kad mokymosi klaidos kainuoja mažiau.</p>
<h2>Bazinė pradinė paletė</h2>
<ul>
<li><strong>Natūralūs tonai (.0)</strong> nuo 4.0 iki 8.0 — dažniausiai naudojami, tinka žilų dengimui.</li>
<li><strong>Pelenų tonai (.1)</strong> — geltonumui ir šiltumui neutralizuoti.</li>
<li>1–2 madingi atspalviai pagal jūsų klientūrą.</li>
</ul>
<h2>Oksidantai</h2>
<p>Pakanka trijų: <strong>10 vol (3 %)</strong> tonui į toną ir žilų dengimui, <strong>20 vol (6 %)</strong> universaliam 1–2 tonų šviesinimui, <strong>30 vol (9 %)</strong> stipresniam šviesinimui. Maišymo santykis su dažais — 1:2.</p>
<h2>Ko vengti pradžioje</h2>
<p>Neperkraukite paletės retais atspalviais, nepradėkite nuo sudėtingų balinimo technikų ir visada darykite sruogos testą.</p>
<h2>Kodėl 180 ml pakuotė tinka mokymuisi</h2>
<p>Didesnė pakuotė už mažesnę kainą už mililitrą reiškia, kad praktikai ir bandymams išleisite mažiau. Tai ypač svarbu, kol „pildosi ranka".</p>
<h2>Dažni klausimai</h2>
<h3>Nuo kokių spalvų pradėti koloristui?</h3>
<p>Nuo natūralių tonų (.0) bazinės paletės ir kelių pelenų (.1) atspalvių neutralizavimui.</p>
<h3>Kiek oksidantų reikia pradžioje?</h3>
<p>Trijų — 10, 20 ir 30 vol. Jie padengia daugumą pradinių darbų.</p>
<h3>Ar Color SHOCK tinka pradedančiajam?</h3>
<p>Taip — profesionali formulė ir 180 ml pakuotė (mažesnė savikaina) leidžia mokytis nešvaistant biudžeto.</p>`,
  content_en: `<p><strong>A beginner colorist should start with a base palette of natural tones (.0), a few ash (.1) shades to neutralise warmth, and a developer set (10, 20 and 30 vol).</strong> Color SHOCK 180 ml packs (from €7.90, €0.044/ml) make practice cheaper — a lower cost per coloring means learning mistakes cost less.</p>
<h2>Base starter palette</h2>
<ul>
<li><strong>Natural tones (.0)</strong> from 4.0 to 8.0 — the most used, good for grey coverage.</li>
<li><strong>Ash tones (.1)</strong> — to neutralise yellow and warmth.</li>
<li>1–2 fashion shades for your clientele.</li>
</ul>
<h2>Developers</h2>
<p>Three are enough: <strong>10 vol (3%)</strong> for tone-on-tone and grey coverage, <strong>20 vol (6%)</strong> for universal 1–2 levels of lift, <strong>30 vol (9%)</strong> for stronger lift. Mixing ratio with dye is 1:2.</p>
<h2>What to avoid at the start</h2>
<p>Do not overload the palette with rare shades, do not begin with complex bleaching techniques, and always do a strand test.</p>
<h2>Why the 180 ml pack suits learning</h2>
<p>A larger pack at a lower price per millilitre means you spend less on practice and tests — important while you build your skills.</p>
<h2>Frequently Asked Questions</h2>
<h3>Which colors should a colorist start with?</h3>
<p>A base palette of natural tones (.0) and a few ash (.1) shades for neutralising.</p>
<h3>How many developers are needed at the start?</h3>
<p>Three — 10, 20 and 30 vol. They cover most early work.</p>
<h3>Is Color SHOCK suitable for beginners?</h3>
<p>Yes — a professional formula and the 180 ml pack (lower cost) let you learn without wasting budget.</p>`,
  content_ru: `<p><strong>Начинающему колористу стоит начать с базовой палитры натуральных тонов (.0), нескольких пепельных (.1) оттенков для нейтрализации тепла и набора окислителей (10, 20 и 30 vol).</strong> Упаковки Color SHOCK 180 мл (от €7,90, €0,044/мл) делают практику дешевле — меньшая себестоимость окрашивания означает, что ошибки обучения стоят меньше.</p>
<h2>Базовая стартовая палитра</h2>
<ul>
<li><strong>Натуральные тона (.0)</strong> от 4.0 до 8.0 — самые востребованные, подходят для седины.</li>
<li><strong>Пепельные тона (.1)</strong> — для нейтрализации желтизны и тепла.</li>
<li>1–2 модных оттенка под вашу клиентуру.</li>
</ul>
<h2>Окислители</h2>
<p>Достаточно трёх: <strong>10 vol (3%)</strong> для тона в тон и седины, <strong>20 vol (6%)</strong> для универсального осветления на 1–2 тона, <strong>30 vol (9%)</strong> для более сильного осветления. Пропорция с краской — 1:2.</p>
<h2>Чего избегать в начале</h2>
<p>Не перегружайте палитру редкими оттенками, не начинайте со сложных техник обесцвечивания и всегда делайте тест пряди.</p>
<h2>Почему упаковка 180 мл подходит для обучения</h2>
<p>Бóльшая упаковка при меньшей цене за миллилитр означает меньшие расходы на практику и пробы — это важно, пока «набивается рука».</p>
<h2>Часто задаваемые вопросы</h2>
<h3>С каких цветов начать колористу?</h3>
<p>С базовой палитры натуральных тонов (.0) и нескольких пепельных (.1) для нейтрализации.</p>
<h3>Сколько окислителей нужно в начале?</h3>
<p>Трёх — 10, 20 и 30 vol. Они закрывают большинство начальных задач.</p>
<h3>Подходит ли Color SHOCK новичку?</h3>
<p>Да — профессиональная формула и упаковка 180 мл (низкая себестоимость) позволяют учиться, не тратя бюджет.</p>`,
}

const posts = [savikaina, maisymas, pradedanciam]

;(async () => {
  for (const p of posts) {
    const { error } = await s.from('blog_posts').upsert(
      {
        slug: p.slug,
        title_lt: p.title_lt, title_en: p.title_en, title_ru: p.title_ru,
        excerpt_lt: p.excerpt_lt, excerpt_en: p.excerpt_en, excerpt_ru: p.excerpt_ru,
        content_lt: p.content_lt, content_en: p.content_en, content_ru: p.content_ru,
        category: p.category, author: AUTHOR,
        is_published: true, published_at: NOW, updated_at: NOW,
      },
      { onConflict: 'slug' }
    )
    console.log(error ? 'KLAIDA ' + p.slug + ': ' + error.message : 'OK  ' + p.slug)
  }

  // #2 180ml-vs-60ml — prepend tiesioginio atsakymo pastraipą (jei dar nepridėta)
  const { data: ex } = await s.from('blog_posts').select('content_lt, content_en, content_ru').eq('slug', '180ml-vs-60ml').maybeSingle()
  if (ex) {
    const leadLt = '<p><strong>180 ml ir 60 ml profesionalūs dažai skiriasi ne kokybe, o ekonomika.</strong> Color SHOCK 180 ml kainuoja €7,90 (€0,044/ml), o standartinė 60 ml pakuotė — apie €11 (€0,183/ml). Dažų kaina už mililitrą ~76 % mažesnė, o iš vienos 180 ml pakuotės gaunate apie 3 dažymus vietoj vieno.</p>'
    const leadEn = '<p><strong>180 ml and 60 ml professional dyes differ not in quality but in economics.</strong> Color SHOCK 180 ml costs €7.90 (€0.044/ml), while a standard 60 ml pack is about €11 (€0.183/ml). The dye price per millilitre is ~76% lower, and one 180 ml pack gives about 3 colorings instead of one.</p>'
    const leadRu = '<p><strong>Краска 180 мл и 60 мл различаются не качеством, а экономикой.</strong> Color SHOCK 180 мл стоит €7,90 (€0,044/мл), а стандартная упаковка 60 мл — около €11 (€0,183/мл). Цена краски за миллилитр на ~76% ниже, а из одной упаковки 180 мл выходит около 3 окрашиваний вместо одного.</p>'
    const upd = {}
    if (ex.content_lt && !ex.content_lt.includes('~76 % mažesnė')) upd.content_lt = leadLt + ex.content_lt
    if (ex.content_en && !ex.content_en.includes('~76% lower')) upd.content_en = leadEn + ex.content_en
    if (ex.content_ru && !ex.content_ru.includes('~76% ниже')) upd.content_ru = leadRu + ex.content_ru
    if (Object.keys(upd).length) {
      upd.updated_at = NOW
      const { error } = await s.from('blog_posts').update(upd).eq('slug', '180ml-vs-60ml')
      console.log(error ? 'KLAIDA 180ml: ' + error.message : 'OK  180ml-vs-60ml (įžanga pridėta)')
    } else {
      console.log('··  180ml-vs-60ml — įžanga jau buvo')
    }
  }
})()

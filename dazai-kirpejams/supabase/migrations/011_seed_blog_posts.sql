-- ============================================
-- Seed blog_posts from static articles
-- ============================================

-- Avoid duplicates: only insert if slug does not exist

INSERT INTO blog_posts (slug, title_lt, title_en, title_ru, excerpt_lt, excerpt_en, excerpt_ru, content_lt, content_en, content_ru, author, category, is_published, published_at, created_at, updated_at)
SELECT 'kaip-pasirinkti-oksidanta',
       'Kaip pasirinkti tinkamą oksidantą',
       'Kaip pasirinkti tinkamą oksidantą',
       'Kaip pasirinkti tinkamą oksidantą',
       'Tinkamas oksidantas — pagrindas kokybiškam dažymo rezultatui. Sužinokite, kaip parinkti koncentraciją pagal norimą efektą ir plaukų būklę.',
       'Tinkamas oksidantas — pagrindas kokybiškam dažymo rezultatui. Sužinokite, kaip parinkti koncentraciją pagal norimą efektą ir plaukų būklę.',
       'Tinkamas oksidantas — pagrindas kokybiškam dažymo rezultatui. Sužinokite, kaip parinkti koncentraciją pagal norimą efektą ir plaukų būklę.',
       '<p>Oksidanto koncentracija lemia, ar dažai tik dengia, ar šviesina plaukus. Neteisingas pasirinkimas — tai nenuspėjamas rezultatas, sausi plaukai ir nepatenkintas klientas. Šiame straipsnyje apžvelgsime, kada naudoti 3%, 6%, 9% ir 12% oksidantą bei kaip pasirinkti tinkamą koncentraciją pagal klientės plaukų būklę.</p>
<h2>3% oksidantas (10 vol.)</h2>
<p>Švelniausia koncentracija, skirta <strong>toninimui ir spalvos atnaujinimui</strong>. Naudokite, kai norite atgaivinti jau dažytus plaukus, sustiprinti atspalvį arba uždengti pavienius žilus plaukus be šviesinimo efekto.</p>
<h2>6% oksidantas (20 vol.)</h2>
<p>Universali koncentracija. Tinka <strong>standartiniam dažymui tonu į toną</strong>, žilų plaukų dengimui ir plaukų pašviesinimui 1–2 tonais. Tai dažniausiai naudojamas oksidantas salone.</p>
<h2>9% ir 12% oksidantas</h2>
<p>Stipresnės koncentracijos naudojamos plaukų pašviesinimui 2–4 tonais arba balinimo procedūroms. Svarbu: kuo stipresnis oksidantas, tuo daugiau dėmesio plaukų būklei — visada įvertinkite porosity ir elastingumą prieš procedūrą.</p>
<h2>Praktinės rekomendacijos</h2>
<ul><li>Visada atlikite sruogelės testą prieš pirmą dažymą</li><li>Naudokite proporcijas pagal gamintojo nurodymus (Color SHOCK — 1:1,5)</li><li>Nenaudokite seno, atidaryto oksidanto — jis praranda aktyvumą</li><li>Saugokite oksidantą tamsioje, vėsioje vietoje</li></ul>
<p>Teisingas oksidanto pasirinkimas — tai ne tik dažymo rezultatas, bet ir klientės plaukų sveikata ilgalaikėje perspektyvoje.</p>',
       '<p>Oksidanto koncentracija lemia, ar dažai tik dengia, ar šviesina plaukus. Neteisingas pasirinkimas — tai nenuspėjamas rezultatas, sausi plaukai ir nepatenkintas klientas. Šiame straipsnyje apžvelgsime, kada naudoti 3%, 6%, 9% ir 12% oksidantą bei kaip pasirinkti tinkamą koncentraciją pagal klientės plaukų būklę.</p>
<h2>3% oksidantas (10 vol.)</h2>
<p>Švelniausia koncentracija, skirta <strong>toninimui ir spalvos atnaujinimui</strong>. Naudokite, kai norite atgaivinti jau dažytus plaukus, sustiprinti atspalvį arba uždengti pavienius žilus plaukus be šviesinimo efekto.</p>
<h2>6% oksidantas (20 vol.)</h2>
<p>Universali koncentracija. Tinka <strong>standartiniam dažymui tonu į toną</strong>, žilų plaukų dengimui ir plaukų pašviesinimui 1–2 tonais. Tai dažniausiai naudojamas oksidantas salone.</p>
<h2>9% ir 12% oksidantas</h2>
<p>Stipresnės koncentracijos naudojamos plaukų pašviesinimui 2–4 tonais arba balinimo procedūroms. Svarbu: kuo stipresnis oksidantas, tuo daugiau dėmesio plaukų būklei — visada įvertinkite porosity ir elastingumą prieš procedūrą.</p>
<h2>Praktinės rekomendacijos</h2>
<ul><li>Visada atlikite sruogelės testą prieš pirmą dažymą</li><li>Naudokite proporcijas pagal gamintojo nurodymus (Color SHOCK — 1:1,5)</li><li>Nenaudokite seno, atidaryto oksidanto — jis praranda aktyvumą</li><li>Saugokite oksidantą tamsioje, vėsioje vietoje</li></ul>
<p>Teisingas oksidanto pasirinkimas — tai ne tik dažymo rezultatas, bet ir klientės plaukų sveikata ilgalaikėje perspektyvoje.</p>',
       '<p>Oksidanto koncentracija lemia, ar dažai tik dengia, ar šviesina plaukus. Neteisingas pasirinkimas — tai nenuspėjamas rezultatas, sausi plaukai ir nepatenkintas klientas. Šiame straipsnyje apžvelgsime, kada naudoti 3%, 6%, 9% ir 12% oksidantą bei kaip pasirinkti tinkamą koncentraciją pagal klientės plaukų būklę.</p>
<h2>3% oksidantas (10 vol.)</h2>
<p>Švelniausia koncentracija, skirta <strong>toninimui ir spalvos atnaujinimui</strong>. Naudokite, kai norite atgaivinti jau dažytus plaukus, sustiprinti atspalvį arba uždengti pavienius žilus plaukus be šviesinimo efekto.</p>
<h2>6% oksidantas (20 vol.)</h2>
<p>Universali koncentracija. Tinka <strong>standartiniam dažymui tonu į toną</strong>, žilų plaukų dengimui ir plaukų pašviesinimui 1–2 tonais. Tai dažniausiai naudojamas oksidantas salone.</p>
<h2>9% ir 12% oksidantas</h2>
<p>Stipresnės koncentracijos naudojamos plaukų pašviesinimui 2–4 tonais arba balinimo procedūroms. Svarbu: kuo stipresnis oksidantas, tuo daugiau dėmesio plaukų būklei — visada įvertinkite porosity ir elastingumą prieš procedūrą.</p>
<h2>Praktinės rekomendacijos</h2>
<ul><li>Visada atlikite sruogelės testą prieš pirmą dažymą</li><li>Naudokite proporcijas pagal gamintojo nurodymus (Color SHOCK — 1:1,5)</li><li>Nenaudokite seno, atidaryto oksidanto — jis praranda aktyvumą</li><li>Saugokite oksidantą tamsioje, vėsioje vietoje</li></ul>
<p>Teisingas oksidanto pasirinkimas — tai ne tik dažymo rezultatas, bet ir klientės plaukų sveikata ilgalaikėje perspektyvoje.</p>',
       NULL,
       'patarimai',
       true,
       '2026-03-28T12:00:00+00:00',
       '2026-03-28T12:00:00+00:00',
       now()
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'kaip-pasirinkti-oksidanta');

INSERT INTO blog_posts (slug, title_lt, title_en, title_ru, excerpt_lt, excerpt_en, excerpt_ru, content_lt, content_en, content_ru, author, category, is_published, published_at, created_at, updated_at)
SELECT '180ml-vs-60ml',
       '180 ml vs 60 ml: kuo skiriasi?',
       '180 ml vs 60 ml: kuo skiriasi?',
       '180 ml vs 60 ml: kuo skiriasi?',
       'Didesnė pakuotė — ne tik daugiau produkto. Palyginome kainas, naudojimo efektyvumą ir praktišką naudą kasdieniam darbui salone.',
       'Didesnė pakuotė — ne tik daugiau produkto. Palyginome kainas, naudojimo efektyvumą ir praktišką naudą kasdieniam darbui salone.',
       'Didesnė pakuotė — ne tik daugiau produkto. Palyginome kainas, naudojimo efektyvumą ir praktišką naudą kasdieniam darbui salone.',
       '<p>Profesionaliam kirpėjui ar koloristui dažų pakuotės dydis yra ne estetinis, o ekonominis klausimas. Kiekviena papildoma pakuotė, kurią atidarote per dieną, — tai papildomos išlaidos, papildomos atliekos ir papildomas laikas užsakymams tvarkyti. Šiame straipsnyje palyginsime standartinę 60 ml ir Color SHOCK 180 ml pakuotes — skaičiais, faktais ir praktiniu požiūriu.</p>
<h2>Standartinė 60 ml pakuotė</h2>
<p>Dauguma profesionalių plaukų dažų gamintojų Europoje siūlo 60 ml tūbio formato pakuotes. Tai ilgametis rinkos standartas, prie kurio įpratusi dauguma specialistų. Vieno dažymo metu vidutiniškai sunaudojama 60–80 ml dažų mišinio (dažai + oksidantas), o tai reiškia, kad viena pakuotė dažnai išnaudojama per vieną procedūrą.</p>
<p>Salonams, kurie aptarnauja keliolika klienčių kasdien, tai reiškia didelį pakuočių kiekį per mėnesį. Kiekviena pakuotė — tai ir kaina, ir logistika, ir atliekos. Be to, ne visada tiksliai sunaudojamas visas tūris: dažnai tūbio dugne lieka 5–10 ml produkto, kurio nebeįmanoma panaudoti.</p>
<h2>Color SHOCK 180 ml pranašumas</h2>
<p>Color SHOCK profesionalūs plaukų dažai pateikiami <strong>180 ml pakuotėse</strong> — tai triskart didesnė talpa nei rinkos standartas. Šis sprendimas buvo sukurtas būtent profesionalams, dirbantiems intensyviai ir kasdien.</p>
<p>Didesnė pakuotė suteikia keletą svarbių pranašumų:</p>
<ul><li><strong>Mažesnė kaina per ml</strong> — didesnė talpa leidžia taikyti ekonomiškesnę kainodarą</li><li><strong>Mažiau atliekų</strong> — viena pakuotė atstoja tris standartines, tai reiškia tris kartus mažiau atliekų</li><li><strong>Patogesnis naudojimas</strong> — rečiau reikia keisti tūbius darbo metu</li><li><strong>Paprastesnė logistika</strong> — mažiau pakuočių užsakyti, saugoti ir tvarkyti</li><li><strong>Mažiau iššvaistyto produkto</strong> — procentaliai mažiau dažų lieka tūbio dugne</li></ul>
<h2>Palyginimo lentelė</h2>
<p>Pažiūrėkime konkrečius skaičius, lyginant standartinę 60 ml pakuotę su Color SHOCK 180 ml:</p>
<table><thead><tr><th>Parametras</th><th>Standartiniai dažai (60 ml)</th><th>Color SHOCK (180 ml)</th></tr></thead><tbody><tr><td>Talpa</td><td>60 ml</td><td>180 ml</td></tr><tr><td>Kaina</td><td>~5,00 €</td><td>7,99 €</td></tr><tr><td>Kaina per ml</td><td>~0,083 €/ml</td><td>0,044 €/ml</td></tr><tr><td>Pakuočių per mėnesį (80 dažymų)</td><td>~80 vnt.</td><td>~27 vnt.</td></tr><tr><td>Atliekos per mėnesį</td><td>80 tūbių</td><td>27 tūbiai</td></tr></tbody></table>
<blockquote>Kaina per ml — tai objektyviausias būdas palyginti dažų vertę. Color SHOCK 180 ml pakuotėje vienas mililitras kainuoja beveik dvigubai pigiau nei standartiniuose dažuose.</blockquote>
<h2>Ekonominis skaičiavimas</h2>
<p>Paimkime konkretų pavyzdį. Salonas atlieka <strong>20 dažymų per savaitę</strong> (4 dažymai per dieną, 5 darbo dienos). Kiekvienam dažymui vidutiniškai sunaudojama 60 ml dažų (be oksidanto).</p>
<h3>Su standartiniais 60 ml dažais:</h3>
<ul><li>Per savaitę: 20 pakuočių × 5,00 € = <strong>100,00 €</strong></li><li>Per mėnesį: 80 pakuočių × 5,00 € = <strong>400,00 €</strong></li><li>Per metus: 960 pakuočių × 5,00 € = <strong>4 800,00 €</strong></li></ul>
<h3>Su Color SHOCK 180 ml:</h3>
<ul><li>Per savaitę: ~7 pakuotės × 7,99 € = <strong>55,93 €</strong></li><li>Per mėnesį: ~27 pakuotės × 7,99 € = <strong>215,73 €</strong></li><li>Per metus: ~320 pakuočių × 7,99 € = <strong>2 556,80 €</strong></li></ul>
<blockquote>Metinis sutaupymas — daugiau nei <strong>2 200 €</strong>. Tai reikšminga suma, kurią galima investuoti į salono plėtrą, naują įrangą ar darbuotojų mokymus.</blockquote>
<h2>Praktinė nauda kasdien</h2>
<p>Ekonominis aspektas — svarbus, tačiau ne vienintelis. Kasdieniam darbui salone 180 ml pakuotė suteikia ir kitokios praktinės naudos, apie kurią kolegos dažnai nekalba.</p>
<p><strong>Mažiau užsakymų.</strong> Užuot užsakę 80 tūbių per mėnesį, užsakysite 27. Tai mažiau laiko, skirto užsakymų formavimui, priėmimui ir sandėliavimui.</p>
<p><strong>Kompaktiškesnis sandėliavimas.</strong> 27 tūbiai užima žymiai mažiau vietos nei 80. Salono darbo erdvė lieka tvarkinga ir laisva.</p>
<p><strong>Mažiau atliekų.</strong> Mažiau pakuočių — mažiau plastiko atliekų. Jei Jūsų salonui svarbus tvarumo aspektas, tai konkretus žingsnis ta linkme.</p>
<p><strong>Patogesnis darbas.</strong> Viena 180 ml pakuotė gali būti naudojama keliems dažymams iš eilės, todėl nereikia nuolat atsukti naujų tūbių. Darbo procesas tampa sklandesnis ir greitesnis.</p>
<h2>Išvada</h2>
<p>Pakuotės dydis — tai ne smulkmena. Tai sprendimas, kuris kasdien veikia Jūsų salono pelningumą, darbo patogumus ir išlaidų kontrolę. Color SHOCK 180 ml pakuotė sukurta būtent tam — suteikti profesionalui daugiau produkto, mažesne kaina per ml, su mažiau rūpesčių dėl logistikos ir atliekų.</p>',
       '<p>Profesionaliam kirpėjui ar koloristui dažų pakuotės dydis yra ne estetinis, o ekonominis klausimas. Kiekviena papildoma pakuotė, kurią atidarote per dieną, — tai papildomos išlaidos, papildomos atliekos ir papildomas laikas užsakymams tvarkyti. Šiame straipsnyje palyginsime standartinę 60 ml ir Color SHOCK 180 ml pakuotes — skaičiais, faktais ir praktiniu požiūriu.</p>
<h2>Standartinė 60 ml pakuotė</h2>
<p>Dauguma profesionalių plaukų dažų gamintojų Europoje siūlo 60 ml tūbio formato pakuotes. Tai ilgametis rinkos standartas, prie kurio įpratusi dauguma specialistų. Vieno dažymo metu vidutiniškai sunaudojama 60–80 ml dažų mišinio (dažai + oksidantas), o tai reiškia, kad viena pakuotė dažnai išnaudojama per vieną procedūrą.</p>
<p>Salonams, kurie aptarnauja keliolika klienčių kasdien, tai reiškia didelį pakuočių kiekį per mėnesį. Kiekviena pakuotė — tai ir kaina, ir logistika, ir atliekos. Be to, ne visada tiksliai sunaudojamas visas tūris: dažnai tūbio dugne lieka 5–10 ml produkto, kurio nebeįmanoma panaudoti.</p>
<h2>Color SHOCK 180 ml pranašumas</h2>
<p>Color SHOCK profesionalūs plaukų dažai pateikiami <strong>180 ml pakuotėse</strong> — tai triskart didesnė talpa nei rinkos standartas. Šis sprendimas buvo sukurtas būtent profesionalams, dirbantiems intensyviai ir kasdien.</p>
<p>Didesnė pakuotė suteikia keletą svarbių pranašumų:</p>
<ul><li><strong>Mažesnė kaina per ml</strong> — didesnė talpa leidžia taikyti ekonomiškesnę kainodarą</li><li><strong>Mažiau atliekų</strong> — viena pakuotė atstoja tris standartines, tai reiškia tris kartus mažiau atliekų</li><li><strong>Patogesnis naudojimas</strong> — rečiau reikia keisti tūbius darbo metu</li><li><strong>Paprastesnė logistika</strong> — mažiau pakuočių užsakyti, saugoti ir tvarkyti</li><li><strong>Mažiau iššvaistyto produkto</strong> — procentaliai mažiau dažų lieka tūbio dugne</li></ul>
<h2>Palyginimo lentelė</h2>
<p>Pažiūrėkime konkrečius skaičius, lyginant standartinę 60 ml pakuotę su Color SHOCK 180 ml:</p>
<table><thead><tr><th>Parametras</th><th>Standartiniai dažai (60 ml)</th><th>Color SHOCK (180 ml)</th></tr></thead><tbody><tr><td>Talpa</td><td>60 ml</td><td>180 ml</td></tr><tr><td>Kaina</td><td>~5,00 €</td><td>7,99 €</td></tr><tr><td>Kaina per ml</td><td>~0,083 €/ml</td><td>0,044 €/ml</td></tr><tr><td>Pakuočių per mėnesį (80 dažymų)</td><td>~80 vnt.</td><td>~27 vnt.</td></tr><tr><td>Atliekos per mėnesį</td><td>80 tūbių</td><td>27 tūbiai</td></tr></tbody></table>
<blockquote>Kaina per ml — tai objektyviausias būdas palyginti dažų vertę. Color SHOCK 180 ml pakuotėje vienas mililitras kainuoja beveik dvigubai pigiau nei standartiniuose dažuose.</blockquote>
<h2>Ekonominis skaičiavimas</h2>
<p>Paimkime konkretų pavyzdį. Salonas atlieka <strong>20 dažymų per savaitę</strong> (4 dažymai per dieną, 5 darbo dienos). Kiekvienam dažymui vidutiniškai sunaudojama 60 ml dažų (be oksidanto).</p>
<h3>Su standartiniais 60 ml dažais:</h3>
<ul><li>Per savaitę: 20 pakuočių × 5,00 € = <strong>100,00 €</strong></li><li>Per mėnesį: 80 pakuočių × 5,00 € = <strong>400,00 €</strong></li><li>Per metus: 960 pakuočių × 5,00 € = <strong>4 800,00 €</strong></li></ul>
<h3>Su Color SHOCK 180 ml:</h3>
<ul><li>Per savaitę: ~7 pakuotės × 7,99 € = <strong>55,93 €</strong></li><li>Per mėnesį: ~27 pakuotės × 7,99 € = <strong>215,73 €</strong></li><li>Per metus: ~320 pakuočių × 7,99 € = <strong>2 556,80 €</strong></li></ul>
<blockquote>Metinis sutaupymas — daugiau nei <strong>2 200 €</strong>. Tai reikšminga suma, kurią galima investuoti į salono plėtrą, naują įrangą ar darbuotojų mokymus.</blockquote>
<h2>Praktinė nauda kasdien</h2>
<p>Ekonominis aspektas — svarbus, tačiau ne vienintelis. Kasdieniam darbui salone 180 ml pakuotė suteikia ir kitokios praktinės naudos, apie kurią kolegos dažnai nekalba.</p>
<p><strong>Mažiau užsakymų.</strong> Užuot užsakę 80 tūbių per mėnesį, užsakysite 27. Tai mažiau laiko, skirto užsakymų formavimui, priėmimui ir sandėliavimui.</p>
<p><strong>Kompaktiškesnis sandėliavimas.</strong> 27 tūbiai užima žymiai mažiau vietos nei 80. Salono darbo erdvė lieka tvarkinga ir laisva.</p>
<p><strong>Mažiau atliekų.</strong> Mažiau pakuočių — mažiau plastiko atliekų. Jei Jūsų salonui svarbus tvarumo aspektas, tai konkretus žingsnis ta linkme.</p>
<p><strong>Patogesnis darbas.</strong> Viena 180 ml pakuotė gali būti naudojama keliems dažymams iš eilės, todėl nereikia nuolat atsukti naujų tūbių. Darbo procesas tampa sklandesnis ir greitesnis.</p>
<h2>Išvada</h2>
<p>Pakuotės dydis — tai ne smulkmena. Tai sprendimas, kuris kasdien veikia Jūsų salono pelningumą, darbo patogumus ir išlaidų kontrolę. Color SHOCK 180 ml pakuotė sukurta būtent tam — suteikti profesionalui daugiau produkto, mažesne kaina per ml, su mažiau rūpesčių dėl logistikos ir atliekų.</p>',
       '<p>Profesionaliam kirpėjui ar koloristui dažų pakuotės dydis yra ne estetinis, o ekonominis klausimas. Kiekviena papildoma pakuotė, kurią atidarote per dieną, — tai papildomos išlaidos, papildomos atliekos ir papildomas laikas užsakymams tvarkyti. Šiame straipsnyje palyginsime standartinę 60 ml ir Color SHOCK 180 ml pakuotes — skaičiais, faktais ir praktiniu požiūriu.</p>
<h2>Standartinė 60 ml pakuotė</h2>
<p>Dauguma profesionalių plaukų dažų gamintojų Europoje siūlo 60 ml tūbio formato pakuotes. Tai ilgametis rinkos standartas, prie kurio įpratusi dauguma specialistų. Vieno dažymo metu vidutiniškai sunaudojama 60–80 ml dažų mišinio (dažai + oksidantas), o tai reiškia, kad viena pakuotė dažnai išnaudojama per vieną procedūrą.</p>
<p>Salonams, kurie aptarnauja keliolika klienčių kasdien, tai reiškia didelį pakuočių kiekį per mėnesį. Kiekviena pakuotė — tai ir kaina, ir logistika, ir atliekos. Be to, ne visada tiksliai sunaudojamas visas tūris: dažnai tūbio dugne lieka 5–10 ml produkto, kurio nebeįmanoma panaudoti.</p>
<h2>Color SHOCK 180 ml pranašumas</h2>
<p>Color SHOCK profesionalūs plaukų dažai pateikiami <strong>180 ml pakuotėse</strong> — tai triskart didesnė talpa nei rinkos standartas. Šis sprendimas buvo sukurtas būtent profesionalams, dirbantiems intensyviai ir kasdien.</p>
<p>Didesnė pakuotė suteikia keletą svarbių pranašumų:</p>
<ul><li><strong>Mažesnė kaina per ml</strong> — didesnė talpa leidžia taikyti ekonomiškesnę kainodarą</li><li><strong>Mažiau atliekų</strong> — viena pakuotė atstoja tris standartines, tai reiškia tris kartus mažiau atliekų</li><li><strong>Patogesnis naudojimas</strong> — rečiau reikia keisti tūbius darbo metu</li><li><strong>Paprastesnė logistika</strong> — mažiau pakuočių užsakyti, saugoti ir tvarkyti</li><li><strong>Mažiau iššvaistyto produkto</strong> — procentaliai mažiau dažų lieka tūbio dugne</li></ul>
<h2>Palyginimo lentelė</h2>
<p>Pažiūrėkime konkrečius skaičius, lyginant standartinę 60 ml pakuotę su Color SHOCK 180 ml:</p>
<table><thead><tr><th>Parametras</th><th>Standartiniai dažai (60 ml)</th><th>Color SHOCK (180 ml)</th></tr></thead><tbody><tr><td>Talpa</td><td>60 ml</td><td>180 ml</td></tr><tr><td>Kaina</td><td>~5,00 €</td><td>7,99 €</td></tr><tr><td>Kaina per ml</td><td>~0,083 €/ml</td><td>0,044 €/ml</td></tr><tr><td>Pakuočių per mėnesį (80 dažymų)</td><td>~80 vnt.</td><td>~27 vnt.</td></tr><tr><td>Atliekos per mėnesį</td><td>80 tūbių</td><td>27 tūbiai</td></tr></tbody></table>
<blockquote>Kaina per ml — tai objektyviausias būdas palyginti dažų vertę. Color SHOCK 180 ml pakuotėje vienas mililitras kainuoja beveik dvigubai pigiau nei standartiniuose dažuose.</blockquote>
<h2>Ekonominis skaičiavimas</h2>
<p>Paimkime konkretų pavyzdį. Salonas atlieka <strong>20 dažymų per savaitę</strong> (4 dažymai per dieną, 5 darbo dienos). Kiekvienam dažymui vidutiniškai sunaudojama 60 ml dažų (be oksidanto).</p>
<h3>Su standartiniais 60 ml dažais:</h3>
<ul><li>Per savaitę: 20 pakuočių × 5,00 € = <strong>100,00 €</strong></li><li>Per mėnesį: 80 pakuočių × 5,00 € = <strong>400,00 €</strong></li><li>Per metus: 960 pakuočių × 5,00 € = <strong>4 800,00 €</strong></li></ul>
<h3>Su Color SHOCK 180 ml:</h3>
<ul><li>Per savaitę: ~7 pakuotės × 7,99 € = <strong>55,93 €</strong></li><li>Per mėnesį: ~27 pakuotės × 7,99 € = <strong>215,73 €</strong></li><li>Per metus: ~320 pakuočių × 7,99 € = <strong>2 556,80 €</strong></li></ul>
<blockquote>Metinis sutaupymas — daugiau nei <strong>2 200 €</strong>. Tai reikšminga suma, kurią galima investuoti į salono plėtrą, naują įrangą ar darbuotojų mokymus.</blockquote>
<h2>Praktinė nauda kasdien</h2>
<p>Ekonominis aspektas — svarbus, tačiau ne vienintelis. Kasdieniam darbui salone 180 ml pakuotė suteikia ir kitokios praktinės naudos, apie kurią kolegos dažnai nekalba.</p>
<p><strong>Mažiau užsakymų.</strong> Užuot užsakę 80 tūbių per mėnesį, užsakysite 27. Tai mažiau laiko, skirto užsakymų formavimui, priėmimui ir sandėliavimui.</p>
<p><strong>Kompaktiškesnis sandėliavimas.</strong> 27 tūbiai užima žymiai mažiau vietos nei 80. Salono darbo erdvė lieka tvarkinga ir laisva.</p>
<p><strong>Mažiau atliekų.</strong> Mažiau pakuočių — mažiau plastiko atliekų. Jei Jūsų salonui svarbus tvarumo aspektas, tai konkretus žingsnis ta linkme.</p>
<p><strong>Patogesnis darbas.</strong> Viena 180 ml pakuotė gali būti naudojama keliems dažymams iš eilės, todėl nereikia nuolat atsukti naujų tūbių. Darbo procesas tampa sklandesnis ir greitesnis.</p>
<h2>Išvada</h2>
<p>Pakuotės dydis — tai ne smulkmena. Tai sprendimas, kuris kasdien veikia Jūsų salono pelningumą, darbo patogumus ir išlaidų kontrolę. Color SHOCK 180 ml pakuotė sukurta būtent tam — suteikti profesionalui daugiau produkto, mažesne kaina per ml, su mažiau rūpesčių dėl logistikos ir atliekų.</p>',
       NULL,
       'produktai',
       true,
       '2026-03-15T12:00:00+00:00',
       '2026-03-15T12:00:00+00:00',
       now()
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = '180ml-vs-60ml');

INSERT INTO blog_posts (slug, title_lt, title_en, title_ru, excerpt_lt, excerpt_en, excerpt_ru, content_lt, content_en, content_ru, author, category, is_published, published_at, created_at, updated_at)
SELECT 'dazymo-technikos',
       'Dažymo technikos profesionalams',
       'Dažymo technikos profesionalams',
       'Dažymo technikos profesionalams',
       'Balayage, ombré, sluočių technika — apžvelgiame populiariausias dažymo technikas ir patariame, kaip pasiekti geriausius rezultatus.',
       'Balayage, ombré, sluočių technika — apžvelgiame populiariausias dažymo technikas ir patariame, kaip pasiekti geriausius rezultatus.',
       'Balayage, ombré, sluočių technika — apžvelgiame populiariausias dažymo technikas ir patariame, kaip pasiekti geriausius rezultatus.',
       '<p>Moderni kolorizacija nebėra vien tik „vienos spalvos" dažymas. Klientės vis dažniau ateina su konkrečiomis idėjomis iš socialinių tinklų — balayage, ombré, money piece, foilayage. Šiame straipsnyje apžvelgsime populiariausias technikas ir duosime praktinių patarimų, kaip jas atlikti profesionaliai.</p>
<h2>Balayage</h2>
<p>Prancūziškos kilmės technika, kuri 2010-aisiais tapo nauju „aukso standartu". Dažai tepami ranka, be folijos, sukuriant natūralius saulės nudažyto efekto perėjimus. Tinka beveik visiems plaukų tipams, ypač tiems, kas nori mažiau priežiūros reikalaujančio rezultato.</p>
<h2>Ombré ir Sombré</h2>
<p>Aiškus perėjimas nuo tamsių šaknų į šviesius galus. <strong>Sombré</strong> — švelnesnė, subtilesnė ombré versija. Rinkitės sombré klientėms, kurios nori pokyčio, bet ne pernelyg drastiško.</p>
<h2>Foilayage</h2>
<p>Hibridinė technika — balayage rezultatas, bet su folijos pagalba gaunamas intensyvesnis šviesinimas. Tinka tamsiaplaukėms, kurios nori ryškaus balayage efekto.</p>
<h2>Money Piece</h2>
<p>Ryškiai pašviesintos pavienės sruogos veido linijoje. Greita procedūra, didelis vizualinis efektas. Puiki parinktis tarp dviejų didelių dažymų.</p>
<h2>Ką rinktis kiekvienam atvejui</h2>
<ul><li>Natūraliam efektui su minimaliu priežiūros kiekiu — <strong>balayage</strong></li><li>Ryškiam kontrastui — <strong>ombré</strong> arba <strong>foilayage</strong></li><li>Greitam pokyčiui tarp dažymų — <strong>money piece</strong></li><li>Pirmam sprendimui apie šviesinimą — <strong>sombré</strong></li></ul>',
       '<p>Moderni kolorizacija nebėra vien tik „vienos spalvos" dažymas. Klientės vis dažniau ateina su konkrečiomis idėjomis iš socialinių tinklų — balayage, ombré, money piece, foilayage. Šiame straipsnyje apžvelgsime populiariausias technikas ir duosime praktinių patarimų, kaip jas atlikti profesionaliai.</p>
<h2>Balayage</h2>
<p>Prancūziškos kilmės technika, kuri 2010-aisiais tapo nauju „aukso standartu". Dažai tepami ranka, be folijos, sukuriant natūralius saulės nudažyto efekto perėjimus. Tinka beveik visiems plaukų tipams, ypač tiems, kas nori mažiau priežiūros reikalaujančio rezultato.</p>
<h2>Ombré ir Sombré</h2>
<p>Aiškus perėjimas nuo tamsių šaknų į šviesius galus. <strong>Sombré</strong> — švelnesnė, subtilesnė ombré versija. Rinkitės sombré klientėms, kurios nori pokyčio, bet ne pernelyg drastiško.</p>
<h2>Foilayage</h2>
<p>Hibridinė technika — balayage rezultatas, bet su folijos pagalba gaunamas intensyvesnis šviesinimas. Tinka tamsiaplaukėms, kurios nori ryškaus balayage efekto.</p>
<h2>Money Piece</h2>
<p>Ryškiai pašviesintos pavienės sruogos veido linijoje. Greita procedūra, didelis vizualinis efektas. Puiki parinktis tarp dviejų didelių dažymų.</p>
<h2>Ką rinktis kiekvienam atvejui</h2>
<ul><li>Natūraliam efektui su minimaliu priežiūros kiekiu — <strong>balayage</strong></li><li>Ryškiam kontrastui — <strong>ombré</strong> arba <strong>foilayage</strong></li><li>Greitam pokyčiui tarp dažymų — <strong>money piece</strong></li><li>Pirmam sprendimui apie šviesinimą — <strong>sombré</strong></li></ul>',
       '<p>Moderni kolorizacija nebėra vien tik „vienos spalvos" dažymas. Klientės vis dažniau ateina su konkrečiomis idėjomis iš socialinių tinklų — balayage, ombré, money piece, foilayage. Šiame straipsnyje apžvelgsime populiariausias technikas ir duosime praktinių patarimų, kaip jas atlikti profesionaliai.</p>
<h2>Balayage</h2>
<p>Prancūziškos kilmės technika, kuri 2010-aisiais tapo nauju „aukso standartu". Dažai tepami ranka, be folijos, sukuriant natūralius saulės nudažyto efekto perėjimus. Tinka beveik visiems plaukų tipams, ypač tiems, kas nori mažiau priežiūros reikalaujančio rezultato.</p>
<h2>Ombré ir Sombré</h2>
<p>Aiškus perėjimas nuo tamsių šaknų į šviesius galus. <strong>Sombré</strong> — švelnesnė, subtilesnė ombré versija. Rinkitės sombré klientėms, kurios nori pokyčio, bet ne pernelyg drastiško.</p>
<h2>Foilayage</h2>
<p>Hibridinė technika — balayage rezultatas, bet su folijos pagalba gaunamas intensyvesnis šviesinimas. Tinka tamsiaplaukėms, kurios nori ryškaus balayage efekto.</p>
<h2>Money Piece</h2>
<p>Ryškiai pašviesintos pavienės sruogos veido linijoje. Greita procedūra, didelis vizualinis efektas. Puiki parinktis tarp dviejų didelių dažymų.</p>
<h2>Ką rinktis kiekvienam atvejui</h2>
<ul><li>Natūraliam efektui su minimaliu priežiūros kiekiu — <strong>balayage</strong></li><li>Ryškiam kontrastui — <strong>ombré</strong> arba <strong>foilayage</strong></li><li>Greitam pokyčiui tarp dažymų — <strong>money piece</strong></li><li>Pirmam sprendimui apie šviesinimą — <strong>sombré</strong></li></ul>',
       NULL,
       'patarimai',
       true,
       '2026-02-20T12:00:00+00:00',
       '2026-02-20T12:00:00+00:00',
       now()
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'dazymo-technikos');

INSERT INTO blog_posts (slug, title_lt, title_en, title_ru, excerpt_lt, excerpt_en, excerpt_ru, content_lt, content_en, content_ru, author, category, is_published, published_at, created_at, updated_at)
SELECT 'spalvu-tendencijos-2026',
       'Spalvų tendencijos 2026 metams',
       'Spalvų tendencijos 2026 metams',
       'Spalvų tendencijos 2026 metams',
       'Kokie atspalviai dominuos šį sezoną? Apžvelgiame populiariausius tonus ir pateikiame Color SHOCK spalvų rekomendacijas Jūsų klientams.',
       'Kokie atspalviai dominuos šį sezoną? Apžvelgiame populiariausius tonus ir pateikiame Color SHOCK spalvų rekomendacijas Jūsų klientams.',
       'Kokie atspalviai dominuos šį sezoną? Apžvelgiame populiariausius tonus ir pateikiame Color SHOCK spalvų rekomendacijas Jūsų klientams.',
       '<p>2026-ieji grįžta prie natūralumo, bet su charakteriu. Tendencijos, kurias matome tarptautinėse grožio savaitėse, rodo aiškią kryptį: <strong>šilti, sodrūs, „rudeniški" tonai</strong> ir sluoksniuotas kolorizavimas, kuris pabrėžia plaukų tekstūrą.</p>
<h2>1. Expensive Brunette</h2>
<p>Giliai ruda bazė su šiltais karamelės ir medaus atšvaitais. Tai ne tamsu, tai <em>brangu</em>. Idealu darbinėms moterims, kurios nori ambicingos, bet profesionalios išvaizdos.</p>
<h2>2. Copper Glow</h2>
<p>Varinis atspalvis tampa vyraujančia ryškia spalva. Nuo subtilaus variaraudonio iki ryškaus pumpkin spice — klientės vis drąsiau renkasi šiltus, ugningus tonus.</p>
<h2>3. Cool Vanilla Blonde</h2>
<p>Klasikinio šalto blondo evoliucija — su vanilės, smėlio ir pieno perlo atšvaitais. Mažiau balta, daugiau sodraus šiltumo.</p>
<h2>4. Chocolate Cherry</h2>
<p>Šokoladinio rudo ir tamsios vyšnios fuzija. Tinka klientėms, kurios ieško drąsos, bet nenori atsitraukti nuo natūralaus tono.</p>
<p>Visos šios tendencijos lengvai pasiekiamos su Color SHOCK paletės 4, 5, 6, 7 ir 8 eilučių atspalviais. Svarbiausia — teisingas oksidantas ir tinkama ekspozicijos trukmė.</p>',
       '<p>2026-ieji grįžta prie natūralumo, bet su charakteriu. Tendencijos, kurias matome tarptautinėse grožio savaitėse, rodo aiškią kryptį: <strong>šilti, sodrūs, „rudeniški" tonai</strong> ir sluoksniuotas kolorizavimas, kuris pabrėžia plaukų tekstūrą.</p>
<h2>1. Expensive Brunette</h2>
<p>Giliai ruda bazė su šiltais karamelės ir medaus atšvaitais. Tai ne tamsu, tai <em>brangu</em>. Idealu darbinėms moterims, kurios nori ambicingos, bet profesionalios išvaizdos.</p>
<h2>2. Copper Glow</h2>
<p>Varinis atspalvis tampa vyraujančia ryškia spalva. Nuo subtilaus variaraudonio iki ryškaus pumpkin spice — klientės vis drąsiau renkasi šiltus, ugningus tonus.</p>
<h2>3. Cool Vanilla Blonde</h2>
<p>Klasikinio šalto blondo evoliucija — su vanilės, smėlio ir pieno perlo atšvaitais. Mažiau balta, daugiau sodraus šiltumo.</p>
<h2>4. Chocolate Cherry</h2>
<p>Šokoladinio rudo ir tamsios vyšnios fuzija. Tinka klientėms, kurios ieško drąsos, bet nenori atsitraukti nuo natūralaus tono.</p>
<p>Visos šios tendencijos lengvai pasiekiamos su Color SHOCK paletės 4, 5, 6, 7 ir 8 eilučių atspalviais. Svarbiausia — teisingas oksidantas ir tinkama ekspozicijos trukmė.</p>',
       '<p>2026-ieji grįžta prie natūralumo, bet su charakteriu. Tendencijos, kurias matome tarptautinėse grožio savaitėse, rodo aiškią kryptį: <strong>šilti, sodrūs, „rudeniški" tonai</strong> ir sluoksniuotas kolorizavimas, kuris pabrėžia plaukų tekstūrą.</p>
<h2>1. Expensive Brunette</h2>
<p>Giliai ruda bazė su šiltais karamelės ir medaus atšvaitais. Tai ne tamsu, tai <em>brangu</em>. Idealu darbinėms moterims, kurios nori ambicingos, bet profesionalios išvaizdos.</p>
<h2>2. Copper Glow</h2>
<p>Varinis atspalvis tampa vyraujančia ryškia spalva. Nuo subtilaus variaraudonio iki ryškaus pumpkin spice — klientės vis drąsiau renkasi šiltus, ugningus tonus.</p>
<h2>3. Cool Vanilla Blonde</h2>
<p>Klasikinio šalto blondo evoliucija — su vanilės, smėlio ir pieno perlo atšvaitais. Mažiau balta, daugiau sodraus šiltumo.</p>
<h2>4. Chocolate Cherry</h2>
<p>Šokoladinio rudo ir tamsios vyšnios fuzija. Tinka klientėms, kurios ieško drąsos, bet nenori atsitraukti nuo natūralaus tono.</p>
<p>Visos šios tendencijos lengvai pasiekiamos su Color SHOCK paletės 4, 5, 6, 7 ir 8 eilučių atspalviais. Svarbiausia — teisingas oksidantas ir tinkama ekspozicijos trukmė.</p>',
       NULL,
       'tendencijos',
       true,
       '2026-01-30T12:00:00+00:00',
       '2026-01-30T12:00:00+00:00',
       now()
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'spalvu-tendencijos-2026');

INSERT INTO blog_posts (slug, title_lt, title_en, title_ru, excerpt_lt, excerpt_en, excerpt_ru, content_lt, content_en, content_ru, author, category, is_published, published_at, created_at, updated_at)
SELECT 'sumazinti-sanaudas',
       'Kaip sumažinti dažų sąnaudas salone',
       'Kaip sumažinti dažų sąnaudas salone',
       'Kaip sumažinti dažų sąnaudas salone',
       'Praktiški patarimai, kaip optimizuoti dažų naudojimą ir sumažinti išlaidas neprarandant dažymo kokybės. Skaičiuojame realų sutaupymą.',
       'Praktiški patarimai, kaip optimizuoti dažų naudojimą ir sumažinti išlaidas neprarandant dažymo kokybės. Skaičiuojame realų sutaupymą.',
       'Praktiški patarimai, kaip optimizuoti dažų naudojimą ir sumažinti išlaidas neprarandant dažymo kokybės. Skaičiuojame realų sutaupymą.',
       '<p>Dažų sąnaudos — dažniausiai antra pagal dydį salono kintamosios išlaidos po nuomos. Net nedidelis jų optimizavimas per metus gali duoti keturženklį sutaupymą. Šiame straipsnyje — konkretūs žingsniai, kaip sumažinti sąnaudas nepakenkiant kokybei.</p>
<h2>1. Tikslus dažų svėrimas</h2>
<p>Svarstyklės kainuoja 15–30 €, o grąžą duoda nuo pirmos savaitės. Vietoj „nuo akies" išspaudimo iš tūbio — tikslus 30, 45, 60 g pasvėrimas. Rezultatas: nebelieka „per daug išmaišyto" mišinio, kuris keliauja į šiukšliadėžę.</p>
<h2>2. Didesnė pakuotė = mažesnė kaina per ml</h2>
<p>Kaip jau nagrinėjome <a href="/lt/blogas/180ml-vs-60ml" style="color: var(--magenta); font-weight: 600;">ankstesniame straipsnyje</a>, 180 ml pakuotėje kaina per ml yra beveik dvigubai mažesnė nei 60 ml standartinėse. Jei kol kas nesate perėję — apsiskaičiuokite metinį sutaupymą skaičiuoklėje.</p>
<h2>3. Standartizuoti protokolai pagal plaukų ilgį</h2>
<p>Sukurkite vidinį dokumentą: <strong>trumpi plaukai — 30 g, vidutiniai — 45 g, ilgi — 60–80 g</strong>. Kai visa komanda dirba vienodais matavimais, sąnaudos tampa prognozuojamos ir suveikia efekto masto taupymas perkant didmena.</p>
<h2>4. Sandėlio rotacija FIFO principu</h2>
<p>First In, First Out — pirma atvežti tūbiai naudojami pirmi. Taip išvengiate nurašymo dėl pasibaigusio galiojimo. Paženklinkite pakuotes atvežimo data.</p>
<h2>5. Derinkite procedūras</h2>
<p>Jei per dieną numatyti du panašaus tono dažymai — sumaišykite šiek tiek didesnį mišinį ir atlikite abi procedūras iš eilės. Sutaupysite ir dažų, ir laiko.</p>
<h2>Tikėtinas rezultatas</h2>
<p>Taikant šiuos 5 principus, vidutinis salonas gali sumažinti dažų sąnaudas <strong>15–25%</strong> per pirmus 3 mėnesius. Jei dabar per mėnesį dažams išleidžiate 400 €, tai yra 60–100 € kas mėnesį, arba 720–1 200 € per metus.</p>',
       '<p>Dažų sąnaudos — dažniausiai antra pagal dydį salono kintamosios išlaidos po nuomos. Net nedidelis jų optimizavimas per metus gali duoti keturženklį sutaupymą. Šiame straipsnyje — konkretūs žingsniai, kaip sumažinti sąnaudas nepakenkiant kokybei.</p>
<h2>1. Tikslus dažų svėrimas</h2>
<p>Svarstyklės kainuoja 15–30 €, o grąžą duoda nuo pirmos savaitės. Vietoj „nuo akies" išspaudimo iš tūbio — tikslus 30, 45, 60 g pasvėrimas. Rezultatas: nebelieka „per daug išmaišyto" mišinio, kuris keliauja į šiukšliadėžę.</p>
<h2>2. Didesnė pakuotė = mažesnė kaina per ml</h2>
<p>Kaip jau nagrinėjome <a href="/lt/blogas/180ml-vs-60ml" style="color: var(--magenta); font-weight: 600;">ankstesniame straipsnyje</a>, 180 ml pakuotėje kaina per ml yra beveik dvigubai mažesnė nei 60 ml standartinėse. Jei kol kas nesate perėję — apsiskaičiuokite metinį sutaupymą skaičiuoklėje.</p>
<h2>3. Standartizuoti protokolai pagal plaukų ilgį</h2>
<p>Sukurkite vidinį dokumentą: <strong>trumpi plaukai — 30 g, vidutiniai — 45 g, ilgi — 60–80 g</strong>. Kai visa komanda dirba vienodais matavimais, sąnaudos tampa prognozuojamos ir suveikia efekto masto taupymas perkant didmena.</p>
<h2>4. Sandėlio rotacija FIFO principu</h2>
<p>First In, First Out — pirma atvežti tūbiai naudojami pirmi. Taip išvengiate nurašymo dėl pasibaigusio galiojimo. Paženklinkite pakuotes atvežimo data.</p>
<h2>5. Derinkite procedūras</h2>
<p>Jei per dieną numatyti du panašaus tono dažymai — sumaišykite šiek tiek didesnį mišinį ir atlikite abi procedūras iš eilės. Sutaupysite ir dažų, ir laiko.</p>
<h2>Tikėtinas rezultatas</h2>
<p>Taikant šiuos 5 principus, vidutinis salonas gali sumažinti dažų sąnaudas <strong>15–25%</strong> per pirmus 3 mėnesius. Jei dabar per mėnesį dažams išleidžiate 400 €, tai yra 60–100 € kas mėnesį, arba 720–1 200 € per metus.</p>',
       '<p>Dažų sąnaudos — dažniausiai antra pagal dydį salono kintamosios išlaidos po nuomos. Net nedidelis jų optimizavimas per metus gali duoti keturženklį sutaupymą. Šiame straipsnyje — konkretūs žingsniai, kaip sumažinti sąnaudas nepakenkiant kokybei.</p>
<h2>1. Tikslus dažų svėrimas</h2>
<p>Svarstyklės kainuoja 15–30 €, o grąžą duoda nuo pirmos savaitės. Vietoj „nuo akies" išspaudimo iš tūbio — tikslus 30, 45, 60 g pasvėrimas. Rezultatas: nebelieka „per daug išmaišyto" mišinio, kuris keliauja į šiukšliadėžę.</p>
<h2>2. Didesnė pakuotė = mažesnė kaina per ml</h2>
<p>Kaip jau nagrinėjome <a href="/lt/blogas/180ml-vs-60ml" style="color: var(--magenta); font-weight: 600;">ankstesniame straipsnyje</a>, 180 ml pakuotėje kaina per ml yra beveik dvigubai mažesnė nei 60 ml standartinėse. Jei kol kas nesate perėję — apsiskaičiuokite metinį sutaupymą skaičiuoklėje.</p>
<h2>3. Standartizuoti protokolai pagal plaukų ilgį</h2>
<p>Sukurkite vidinį dokumentą: <strong>trumpi plaukai — 30 g, vidutiniai — 45 g, ilgi — 60–80 g</strong>. Kai visa komanda dirba vienodais matavimais, sąnaudos tampa prognozuojamos ir suveikia efekto masto taupymas perkant didmena.</p>
<h2>4. Sandėlio rotacija FIFO principu</h2>
<p>First In, First Out — pirma atvežti tūbiai naudojami pirmi. Taip išvengiate nurašymo dėl pasibaigusio galiojimo. Paženklinkite pakuotes atvežimo data.</p>
<h2>5. Derinkite procedūras</h2>
<p>Jei per dieną numatyti du panašaus tono dažymai — sumaišykite šiek tiek didesnį mišinį ir atlikite abi procedūras iš eilės. Sutaupysite ir dažų, ir laiko.</p>
<h2>Tikėtinas rezultatas</h2>
<p>Taikant šiuos 5 principus, vidutinis salonas gali sumažinti dažų sąnaudas <strong>15–25%</strong> per pirmus 3 mėnesius. Jei dabar per mėnesį dažams išleidžiate 400 €, tai yra 60–100 € kas mėnesį, arba 720–1 200 € per metus.</p>',
       NULL,
       'produktai',
       true,
       '2026-01-12T12:00:00+00:00',
       '2026-01-12T12:00:00+00:00',
       now()
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'sumazinti-sanaudas');

INSERT INTO blog_posts (slug, title_lt, title_en, title_ru, excerpt_lt, excerpt_en, excerpt_ru, content_lt, content_en, content_ru, author, category, is_published, published_at, created_at, updated_at)
SELECT 'prieziura-po-dazymo',
       'Plaukų priežiūra po dažymo',
       'Plaukų priežiūra po dažymo',
       'Plaukų priežiūra po dažymo',
       'Ką rekomenduoti klientui po dažymo? Aptariame efektyvias priežiūros priemones ir patarimus, kurie pailgina spalvos išsilaikymą.',
       'Ką rekomenduoti klientui po dažymo? Aptariame efektyvias priežiūros priemones ir patarimus, kurie pailgina spalvos išsilaikymą.',
       'Ką rekomenduoti klientui po dažymo? Aptariame efektyvias priežiūros priemones ir patarimus, kurie pailgina spalvos išsilaikymą.',
       '<p>Dažymas baigiasi ne tuomet, kai klientė išeina iš salono — tuomet prasideda svarbiausia fazė: pirmos 72 valandos. Ką rekomenduoti klientei, kad spalva išsilaikytų ilgiau, o plaukai liktų sveiki?</p>
<h2>Pirmos 72 valandos</h2>
<ul><li>Neplauti plaukų 48–72 val. po dažymo — spalvos molekulės dar „fiksuojasi"</li><li>Vengti karšto vandens — šiltas arba drungnas geriausia</li><li>Nenaudoti lygintuvo aukštoje temperatūroje</li><li>Saugoti plaukus nuo tiesioginių saulės spindulių</li></ul>
<h2>Kasdienis priežiūros protokolas</h2>
<p>Rekomenduokite klientei <strong>sulfatų ir silikonų neturintį šampūną</strong>, skirtą dažytiems plaukams. Sulfatai išplauna spalvą per kelis plovimus, o silikonai neleidžia kaukei prasiskverbti į plauko struktūrą.</p>
<h2>Giluminė priežiūra</h2>
<p>Bent kartą per savaitę — maitinanti kaukė 10–20 minučių. Kaukės, kuriose yra argano aliejaus, keratino ir panthenolio, atstato plauko struktūrą ir padeda spalvai išlikti.</p>
<h2>Kas 4–6 savaites — salone</h2>
<p>Glosas arba tonerio procedūra pailgina spalvos gyvavimą. Tai 20 minučių procedūra, kurios dėka spalva grįžta į pradinį intensyvumą, o klientė jaučia, kad salonas rūpinasi rezultatu ilgalaikiu laikotarpiu — ne tik vieną dieną.</p>',
       '<p>Dažymas baigiasi ne tuomet, kai klientė išeina iš salono — tuomet prasideda svarbiausia fazė: pirmos 72 valandos. Ką rekomenduoti klientei, kad spalva išsilaikytų ilgiau, o plaukai liktų sveiki?</p>
<h2>Pirmos 72 valandos</h2>
<ul><li>Neplauti plaukų 48–72 val. po dažymo — spalvos molekulės dar „fiksuojasi"</li><li>Vengti karšto vandens — šiltas arba drungnas geriausia</li><li>Nenaudoti lygintuvo aukštoje temperatūroje</li><li>Saugoti plaukus nuo tiesioginių saulės spindulių</li></ul>
<h2>Kasdienis priežiūros protokolas</h2>
<p>Rekomenduokite klientei <strong>sulfatų ir silikonų neturintį šampūną</strong>, skirtą dažytiems plaukams. Sulfatai išplauna spalvą per kelis plovimus, o silikonai neleidžia kaukei prasiskverbti į plauko struktūrą.</p>
<h2>Giluminė priežiūra</h2>
<p>Bent kartą per savaitę — maitinanti kaukė 10–20 minučių. Kaukės, kuriose yra argano aliejaus, keratino ir panthenolio, atstato plauko struktūrą ir padeda spalvai išlikti.</p>
<h2>Kas 4–6 savaites — salone</h2>
<p>Glosas arba tonerio procedūra pailgina spalvos gyvavimą. Tai 20 minučių procedūra, kurios dėka spalva grįžta į pradinį intensyvumą, o klientė jaučia, kad salonas rūpinasi rezultatu ilgalaikiu laikotarpiu — ne tik vieną dieną.</p>',
       '<p>Dažymas baigiasi ne tuomet, kai klientė išeina iš salono — tuomet prasideda svarbiausia fazė: pirmos 72 valandos. Ką rekomenduoti klientei, kad spalva išsilaikytų ilgiau, o plaukai liktų sveiki?</p>
<h2>Pirmos 72 valandos</h2>
<ul><li>Neplauti plaukų 48–72 val. po dažymo — spalvos molekulės dar „fiksuojasi"</li><li>Vengti karšto vandens — šiltas arba drungnas geriausia</li><li>Nenaudoti lygintuvo aukštoje temperatūroje</li><li>Saugoti plaukus nuo tiesioginių saulės spindulių</li></ul>
<h2>Kasdienis priežiūros protokolas</h2>
<p>Rekomenduokite klientei <strong>sulfatų ir silikonų neturintį šampūną</strong>, skirtą dažytiems plaukams. Sulfatai išplauna spalvą per kelis plovimus, o silikonai neleidžia kaukei prasiskverbti į plauko struktūrą.</p>
<h2>Giluminė priežiūra</h2>
<p>Bent kartą per savaitę — maitinanti kaukė 10–20 minučių. Kaukės, kuriose yra argano aliejaus, keratino ir panthenolio, atstato plauko struktūrą ir padeda spalvai išlikti.</p>
<h2>Kas 4–6 savaites — salone</h2>
<p>Glosas arba tonerio procedūra pailgina spalvos gyvavimą. Tai 20 minučių procedūra, kurios dėka spalva grįžta į pradinį intensyvumą, o klientė jaučia, kad salonas rūpinasi rezultatu ilgalaikiu laikotarpiu — ne tik vieną dieną.</p>',
       NULL,
       'patarimai',
       true,
       '2025-12-18T12:00:00+00:00',
       '2025-12-18T12:00:00+00:00',
       now()
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'prieziura-po-dazymo');

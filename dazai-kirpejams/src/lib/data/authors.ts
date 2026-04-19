import type { Locale } from '@/i18n/config'

/**
 * Centralizuotas autorių registras. Šiuo metu turim vieną — Džiuljetą Vėbrę.
 * Naudojama:
 *   - autoriaus puslapyje `/[lang]/autorius/[slug]`
 *   - blog post puslapyje (autoriaus blokas straipsnio apačioje)
 *   - schema.org `Person` ir `BlogPosting.author` kaip URL nuoroda
 *
 * Slug'as bendras visoms kalboms (atitinka /blogas/, /produktai/ pattern'ą).
 * Vardas (`name`) DB atitinka `blog_posts.author` lauką — match'as turi būti
 * tikslus, kad būtų galima resolve'inti autorių pagal post'o lauką.
 */

export type AuthorBio = {
  /** Trumpa, vienos eilutės pozicionavimo eilutė (po vardu) */
  tagline: string
  /** Pilna biografija — markdown'o stiliaus paragrafai (HTML neleidžiamas) */
  paragraphs: string[]
  /** „Greitos žinios" sąrašas dešinėje pusėje */
  highlights: string[]
}

export type Author = {
  slug: string
  /** Vardas tokia pačia forma, kokia saugoma `blog_posts.author` lauke */
  name: string
  jobTitle: Record<Locale, string>
  bio: Record<Locale, AuthorBio>
  /** Profilio nuotrauka (pasiruošta — kai vartotojas atsiųs, įdėt į public/team/) */
  imagePath: string | null
  /** Išoriniai profiliai schema.org `sameAs` laukui */
  sameAs: string[]
  /** Knyga / publikacijos */
  publications: { title: string; year?: number }[]
}

export const AUTHORS: Author[] = [
  {
    slug: 'dziuljeta-vebre',
    name: 'Džiuljeta Vėbrė',
    jobTitle: {
      lt: 'Kirpėja-stilistė, įvaizdžio dizainerė, lektorė',
      en: 'Hairstylist, image designer, lecturer',
      ru: 'Парикмахер-стилист, имидж-дизайнер, лектор',
    },
    bio: {
      lt: {
        tagline:
          'Kūrėja, kuri grožio pasaulį mato plačiau — daugiau nei 30 metų patirtis salone, mokymuose ir aprangos kūryboje grožio specialistams.',
        paragraphs: [
          'Džiuljeta Vėbrė – vardas, kurį daugelis sieja ne tik su plaukų grožiu, bet ir su platesniu požiūriu į žmogaus įvaizdį, profesinį augimą bei darbo kultūrą grožio srityje. Ji žinoma kaip kirpėja-stilistė, vizažistė, įvaizdžio dizainerė, lektorė, knygos autorė ir profesionalios kirpėjų aprangos kūrėja. Daugiau nei 30 metų patirtis leido jai sukaupti ne tik žinių bagažą, bet ir aiškų supratimą, ko šiandien reikia grožio specialistui, kad jis galėtų dirbti profesionaliai, patogiai ir stilingai.',
          'Per ilgus darbo metus Džiuljeta Vėbrė savo veiklą kūrė nuosekliai ir kryptingai. Ji pristatoma kaip Įvaizdžio salono 313 „Rolė" ir „Grožio artelės 313" savininkė ar bendrasavininkė, aktyviai dirbanti su klientais, mokymais ir grožio specialistų profesiniu ugdymu. Viešuose pristatymuose ji taip pat minima kaip lektorė, vedanti seminarus ir ekspres mokymus būsimiems bei jau dirbantiems kirpėjams.',
          'Vienas ryškiausių Džiuljetos Vėbrės išskirtinumų – gebėjimas matyti grožio sritį ne fragmentiškai, o visuminiu principu. Jos profesinis kelias neapsiriboja vien kirpimais ar plaukų spalva. TV3 publikuotoje medžiagoje ji pristatoma kaip įvaizdžio specialistė, kalbanti apie tinkamai parinktos plaukų spalvos svarbą ir jos įtaką žmogaus įvaizdžiui. Toks požiūris atskleidžia jos filosofiją: grožis nėra atsitiktinis efektas, o apgalvotų sprendimų visuma.',
          'Dar viena svarbi jos veiklos kryptis – profesionali darbo apranga grožio specialistams. Oficialioje svetainėje nurodoma, kad Džiuljeta Vėbrė kuria ir gamina kirpėjų aprangą Lietuvoje, o ši apranga pritaikyta realiam darbui salone: naudojamos medžiagos atsparios plaukų dažams, cheminiams preparatams ir šviesinimo milteliams, o dizainas kuriamas atsižvelgiant į komfortą bei judesių laisvę. Ši kryptis gimė iš realaus poreikio – viešoje publikacijoje pažymima, kad, pasigedusi profesionalių sprendimų grožio specialistų aprangai, ji ėmėsi kurti tokią liniją pati.',
          'Būtent ši praktinė patirtis ir daro Džiuljetos Vėbrės vardą išskirtinį. Ji kuria ne iš teorijos, o iš ilgamečio darbo grožio srityje. Todėl jos sprendimuose dera estetika, funkcionalumas ir profesinė logika. Apranga, mokymai, konsultacijos, įvaizdžio formavimas – visa tai susijungia į vieną kryptį: padėti grožio specialistui ne tik geriau atrodyti, bet ir tvirčiau jaustis savo profesiniame kelyje.',
          'Džiuljeta Vėbrė taip pat yra knygos „Nori keist gyvenimą, keisk šukuoseną" autorė. Šis faktas atspindi jos siekį perduoti sukauptą patirtį plačiau – ne tik per tiesioginį darbą ar seminarus, bet ir per autorinį turinį. Jos viešai pristatoma veikla rodo aiškią kryptį: įkvėpti, mokyti, padėti atrasti individualų stilių ir stiprinti grožio profesionalų pasitikėjimą savimi.',
          'Šiandien Džiuljeta Vėbrė daugeliui asocijuojasi su profesionalumu, patirtimi ir kūrybine drąsa. Tai asmenybė, kuri grožio srityje jungia amatą, estetiką, mokymą ir verslumą. Jos darbai ir veikla rodo, kad tikras profesionalumas gimsta ten, kur ilgametė patirtis susitinka su noru kurti tai, kas iš tiesų reikalinga žmonėms.',
        ],
        highlights: [
          '30+ metų patirtis grožio srityje',
          'Įvaizdžio salono „Rolė 313" ir „Grožio artelės 313" savininkė',
          'Lektorė — seminarai ir mokymai grožio specialistams',
          'Profesionalios kirpėjų aprangos kūrėja Lietuvoje',
          'Knygos „Nori keist gyvenimą, keisk šukuoseną" autorė',
          'Vizažistė, įvaizdžio dizainerė',
        ],
      },
      en: {
        tagline:
          'A creator who sees the beauty industry through a wider lens — over 30 years of experience in salon work, training and professional apparel design.',
        paragraphs: [
          'Džiuljeta Vėbrė is a name many associate not only with hair beauty, but with a broader approach to personal image, professional growth and work culture in the beauty industry. She is known as a hairstylist, makeup artist, image designer, lecturer, book author and creator of professional hairdresser apparel. More than 30 years of experience have given her not only deep expertise, but also a clear understanding of what today\'s beauty professional needs in order to work professionally, comfortably and in style.',
          'Throughout her career Džiuljeta Vėbrė has built her work consistently and with focus. She is the owner / co-owner of the "Rolė 313" image salon and "Grožio artelė 313", actively working with clients, running training sessions and developing beauty professionals. Public profiles also describe her as a lecturer who delivers seminars and express training for both aspiring and practising hairdressers.',
          'One of her clearest distinctions is the ability to see the beauty industry holistically, not in fragments. Her professional path is not limited to haircuts or hair colour. In TV3 features she is presented as an image specialist explaining the importance of correctly chosen hair colour and its impact on personal image. This reflects her philosophy: beauty is not an accidental effect, but the result of deliberate decisions.',
          'Another key direction of her work is professional apparel for beauty specialists. Her official site states that Džiuljeta Vėbrė designs and manufactures hairdresser apparel in Lithuania — adapted for real salon work: fabrics resistant to hair dyes, chemical products and bleach powders, with cuts designed for comfort and freedom of movement. This line was born out of real need: feeling that no professional solutions for beauty-specialist apparel were available, she began creating one herself.',
          'It is exactly this hands-on experience that makes Džiuljeta Vėbrė\'s work distinct. She creates from years of practice, not theory — so her solutions combine aesthetics, function and professional logic. Apparel, training, consulting, image work — all of it serves one direction: helping the beauty specialist not only look better, but feel stronger in their professional path.',
          'Džiuljeta Vėbrė is also the author of the book „Nori keist gyvenimą, keisk šukuoseną" ("Want to change your life — change your hairstyle"). This reflects her drive to pass on her accumulated experience more widely — beyond direct work or seminars, through original content as well. Her public work shows a clear direction: to inspire, teach, help discover individual style, and strengthen the confidence of beauty professionals.',
          'Today Džiuljeta Vėbrė stands for professionalism, experience and creative courage. She is a personality who unites craft, aesthetics, teaching and entrepreneurship in beauty. Her work shows that true professionalism is born where long experience meets the will to create what people actually need.',
        ],
        highlights: [
          '30+ years of experience in beauty',
          'Owner of "Rolė 313" image salon and "Grožio artelė 313"',
          'Lecturer — seminars and training for beauty professionals',
          'Designer of professional hairdresser apparel made in Lithuania',
          'Author of the book "Nori keist gyvenimą, keisk šukuoseną"',
          'Makeup artist, image designer',
        ],
      },
      ru: {
        tagline:
          'Автор, видящий индустрию красоты шире — более 30 лет опыта в салоне, обучении и создании профессиональной одежды для парикмахеров.',
        paragraphs: [
          'Джульета Вебре — имя, которое многие связывают не только с красотой волос, но и с более широким взглядом на образ человека, профессиональное развитие и культуру работы в индустрии красоты. Она известна как парикмахер-стилист, визажист, имидж-дизайнер, лектор, автор книги и создатель профессиональной одежды для парикмахеров. Более 30 лет опыта позволили ей собрать не только багаж знаний, но и ясное понимание того, что сегодня нужно мастеру индустрии красоты, чтобы работать профессионально, удобно и стильно.',
          'За долгие годы работы Джульета Вебре строила свою деятельность последовательно и целенаправленно. Она представляется как владелица или совладелица имидж-салона «Rolė 313» и «Grožio artelė 313», активно работающая с клиентами, обучением и профессиональным развитием специалистов индустрии красоты. В публичных представлениях она также упоминается как лектор, ведущий семинары и экспресс-обучения для будущих и уже работающих парикмахеров.',
          'Одна из самых ярких особенностей Джульеты Вебре — способность видеть индустрию красоты не фрагментарно, а целостно. Её профессиональный путь не ограничивается только стрижками или цветом волос. В материалах TV3 она представлена как имидж-специалист, говорящий о важности правильно подобранного цвета волос и его влиянии на образ человека. Такой подход отражает её философию: красота — это не случайный эффект, а совокупность продуманных решений.',
          'Ещё одно важное направление её деятельности — профессиональная рабочая одежда для специалистов индустрии красоты. На официальном сайте указано, что Джульета Вебре создаёт и производит одежду для парикмахеров в Литве, и эта одежда адаптирована для реальной работы в салоне: используются ткани, устойчивые к краскам для волос, химическим препаратам и осветляющим порошкам, а дизайн создаётся с учётом комфорта и свободы движений. Это направление родилось из реальной потребности — в публикации отмечается, что, не найдя профессиональных решений для одежды специалистов индустрии красоты, она начала создавать такую линию сама.',
          'Именно этот практический опыт делает имя Джульеты Вебре особенным. Она создаёт не из теории, а из многолетнего опыта работы в индустрии красоты. Поэтому в её решениях сочетаются эстетика, функциональность и профессиональная логика. Одежда, обучение, консультации, формирование образа — всё это объединяется в одно направление: помочь специалисту индустрии красоты не только лучше выглядеть, но и увереннее чувствовать себя на своём профессиональном пути.',
          'Джульета Вебре также является автором книги «Nori keist gyvenimą, keisk šukuoseną» («Хочешь изменить жизнь — измени причёску»). Этот факт отражает её стремление передать накопленный опыт шире — не только через непосредственную работу или семинары, но и через авторский контент. Её публично представляемая деятельность показывает чёткое направление: вдохновлять, обучать, помогать найти индивидуальный стиль и укреплять уверенность профессионалов индустрии красоты в себе.',
          'Сегодня Джульета Вебре для многих ассоциируется с профессионализмом, опытом и творческой смелостью. Это личность, которая в индустрии красоты объединяет ремесло, эстетику, обучение и предпринимательство. Её работы и деятельность показывают, что настоящий профессионализм рождается там, где многолетний опыт встречается с желанием создавать то, что действительно нужно людям.',
        ],
        highlights: [
          '30+ лет опыта в индустрии красоты',
          'Владелица имидж-салона «Rolė 313» и «Grožio artelė 313»',
          'Лектор — семинары и обучение для мастеров индустрии красоты',
          'Создатель профессиональной одежды для парикмахеров (Литва)',
          'Автор книги «Nori keist gyvenimą, keisk šukuoseną»',
          'Визажист, имидж-дизайнер',
        ],
      },
    },
    imagePath: null,
    sameAs: [],
    publications: [
      { title: 'Nori keist gyvenimą, keisk šukuoseną' },
    ],
  },
]

export function getAuthorBySlug(slug: string): Author | null {
  return AUTHORS.find((a) => a.slug === slug) ?? null
}

/** Resolve'ina autoriaus įrašą pagal `blog_posts.author` lauko reikšmę */
export function getAuthorByName(name: string | null | undefined): Author | null {
  if (!name) return null
  return AUTHORS.find((a) => a.name === name) ?? null
}

'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Container } from '@/components/ui/Container'

const nfText = {
  lt: {
    title: 'Puslapis nerastas',
    desc: 'Ieškomas puslapis neegzistuoja arba buvo perkeltas. Patikrinkite adresą arba grįžkite į pagrindinį puslapį.',
    home: 'Grįžti į pradžią',
    products: 'Peržiūrėti produktus',
  },
  en: {
    title: 'Page not found',
    desc: 'The page you are looking for does not exist or has moved. Check the address or return to the home page.',
    home: 'Back to home',
    products: 'Browse products',
  },
  ru: {
    title: 'Страница не найдена',
    desc: 'Запрашиваемая страница не существует или была перемещена. Проверьте адрес или вернитесь на главную.',
    home: 'На главную',
    products: 'Посмотреть продукты',
  },
} as const

type Lang = keyof typeof nfText

export default function NotFound() {
  const params = useParams()
  const rawLang = (params?.lang as string | undefined) ?? 'lt'
  const lang: Lang = rawLang in nfText ? (rawLang as Lang) : 'lt'
  const t = nfText[lang]
  const prefix = lang === 'lt' ? '' : `/${lang}`

  return (
    <section className="py-24 md:py-32 bg-white">
      <Container>
        <div className="text-center max-w-lg mx-auto">
          <p className="text-[7rem] md:text-[9rem] font-extrabold leading-none text-brand-magenta/15">
            404
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900 -mt-4 mb-4">
            {t.title}
          </h1>
          <p className="text-brand-gray-500 mb-8 leading-relaxed">{t.desc}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={prefix || '/'}
              className="px-8 py-3.5 bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              {t.home}
            </Link>
            <Link
              href={`${prefix}/produktai`}
              className="px-8 py-3.5 border border-[#E0E0E0] text-brand-gray-900 rounded-lg font-semibold hover:border-brand-magenta hover:text-brand-magenta transition-all"
            >
              {t.products}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

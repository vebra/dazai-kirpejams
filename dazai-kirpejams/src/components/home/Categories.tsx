import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/config'

type CategoriesProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

/**
 * Produktų kategorijos — šviesiai pilkas fonas, centruota antraštė
 * su magenta section-label, 4 kortelės (balta, gradient emoji image).
 */
export function Categories({ lang, dict: _dict }: CategoriesProps) {
  const categories = [
    {
      href: `/${lang}/produktai/dazai`,
      icon: '🎨',
      title: 'Plaukų dažai',
      count: 'Color SHOCK • 180 ml',
    },
    {
      href: `/${lang}/produktai/oksidantai`,
      icon: '⚗',
      title: 'Oksidantai',
      count: 'Profesionali linija',
    },
    {
      href: `/${lang}/produktai/sampunai`,
      icon: '🧴',
      title: 'Šampūnai ir priežiūra',
      count: 'RosaNera Cosmetic',
    },
    {
      href: `/${lang}/produktai/priemones`,
      icon: '✂',
      title: 'Pagalbinės priemonės',
      count: 'Kirpėjams',
    },
  ]

  return (
    <section id="produktai" className="py-20 bg-brand-gray-50">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Asortimentas
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
            Produktų kategorijos
          </h2>
          <p className="text-[1.1rem] text-brand-gray-500">
            Viskas, ko reikia profesionaliam darbui salone
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group bg-white rounded-xl overflow-hidden border border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
            >
              <div className="aspect-square bg-[linear-gradient(135deg,#f5f5f7_0%,#e8e8ec_100%)] flex items-center justify-center text-5xl">
                <span aria-hidden>{cat.icon}</span>
              </div>
              <div className="p-5">
                <div className="text-[1.05rem] font-bold text-brand-gray-900 mb-1.5 group-hover:text-brand-magenta transition-colors">
                  {cat.title}
                </div>
                <div className="text-[0.85rem] text-brand-gray-500">
                  {cat.count}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}

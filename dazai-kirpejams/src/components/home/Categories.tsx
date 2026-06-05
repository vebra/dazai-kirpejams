import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { StaggerReveal } from '@/components/ui/StaggerReveal'
import { TiltCard } from '@/components/ui/TiltCard'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

type CategoriesProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

type Item = { slug: string; icon: string; title: string; count: string }

function isImagePath(icon: string): boolean {
  return icon.startsWith('/')
}

export function Categories({ lang, dict }: CategoriesProps) {
  const t = dict.categories
  const items: Item[] = t.items

  return (
    <section id="produktai" className="py-20 bg-brand-gray-50">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {t.label}
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
            {t.title}
          </h2>
          <p className="text-[1.1rem] text-brand-gray-500">
            {t.subtitle}
          </p>
        </div>

        <StaggerReveal className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-6 px-6 py-2 scroll-pl-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:mx-0 lg:px-0 lg:py-0 [&>*]:snap-start [&>*]:shrink-0 [&>*]:w-[58%] sm:[&>*]:w-[40%] lg:[&>*]:w-auto">
          {items.map((cat) => (
            <TiltCard key={cat.slug}>
            <Link
              href={`${langPrefix(lang)}/produktai/${cat.slug}`}
              className="group block h-full bg-white rounded-xl overflow-hidden border border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
            >
              {isImagePath(cat.icon) ? (
                <div className="relative aspect-square bg-[linear-gradient(135deg,#f5f5f7_0%,#e8e8ec_100%)] overflow-hidden">
                  <Image
                    src={cat.icon}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-[linear-gradient(135deg,#f5f5f7_0%,#e8e8ec_100%)] flex items-center justify-center text-5xl">
                  <span aria-hidden>{cat.icon}</span>
                </div>
              )}
              <div className="p-5">
                <div className="text-[1.05rem] font-bold text-brand-gray-900 mb-1.5 group-hover:text-brand-magenta transition-colors">
                  {cat.title}
                </div>
                <div className="text-[0.85rem] text-brand-gray-500">
                  {cat.count}
                </div>
              </div>
            </Link>
            </TiltCard>
          ))}
        </StaggerReveal>
      </Container>
    </section>
  )
}

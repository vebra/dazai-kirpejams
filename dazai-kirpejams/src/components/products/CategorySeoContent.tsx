import { Container } from '@/components/ui/Container'
import {
  getCategorySeoContent,
  type CategorySeo,
} from '@/lib/data/category-seo-content'
import type { Locale } from '@/i18n/config'

/**
 * Kategorijos puslapio SSR turinio blokas — 400+ žodžių per kategoriją.
 * Renderinasi serveryje, todėl Google indeksuoja iš karto, neuse'ina JS
 * hydration'ui. Komponentas tyliai praleidžiamas, jei tai kategorijai
 * turinio nėra (žr. category-seo-content.ts map'ą).
 */
export function CategorySeoContent({
  categorySlug,
  lang,
}: {
  categorySlug: string
  lang: Locale
}) {
  const content: CategorySeo | null = getCategorySeoContent(categorySlug, lang)
  if (!content) return null

  return (
    <section className="py-16 lg:py-20 bg-white">
      <Container>
        <div className="max-w-[820px] mx-auto">
          <p className="text-[1.05rem] lg:text-[1.1rem] leading-[1.75] text-brand-gray-700 mb-10">
            {content.intro}
          </p>

          <div className="space-y-10">
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-[clamp(1.2rem,2.4vw,1.55rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
                  {section.heading}
                </h2>
                <p className="text-[1rem] leading-[1.75] text-brand-gray-700">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { CartView } from '@/components/commerce/CartView'
import { buildPageMetadata } from '@/lib/seo'
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/krepselis'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    ...buildPageMetadata({
      lang,
      path: '/krepselis',
      title: dict.cart.title,
      description: dict.cart.emptyDesc,
    }),
    robots: { index: false, follow: false },
  }
}

export default async function CartPage({
  params,
}: PageProps<'/[lang]/krepselis'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${langPrefix(lang) || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            Pradžia
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">
            {dict.cart.title}
          </span>
        </Container>
      </section>

      {/* Cart */}
      <section className="pt-6 pb-20 bg-white">
        <Container>
          <h1 className="text-[clamp(1.5rem,3.5vw,2rem)] font-bold text-brand-gray-900 mb-8 leading-tight">
            {dict.cart.title}
          </h1>
          <CartView lang={lang} dict={dict} />
        </Container>
      </section>
    </>
  )
}

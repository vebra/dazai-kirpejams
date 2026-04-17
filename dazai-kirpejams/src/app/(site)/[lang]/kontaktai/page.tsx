import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata, buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, localBusinessSchema } from '@/lib/schema'
import { CONTACT, phoneHref } from '@/lib/site'
import { ContactForm } from './ContactForm'

export const revalidate = 300
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/kontaktai'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const t = dict.contactPage
  return buildPageMetadata({
    lang,
    path: '/kontaktai',
    title: t.metaTitle,
    description: t.metaDesc,
  })
}

export default async function ContactPage({
  params,
}: PageProps<'/[lang]/kontaktai'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const t = dict.contactPage
  const c = dict.common
  const p = langPrefix(lang)

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: c.home, url: buildCanonicalUrl(lang, '/') },
        { name: t.badge, url: buildCanonicalUrl(lang, '/kontaktai') },
      ])} />
      <JsonLd data={localBusinessSchema()} />
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link href={`${p || '/'}`} className="hover:text-brand-magenta transition-colors">
            {c.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">{t.badge}</span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-8 lg:py-12 bg-white">
        <Container>
          <div className="text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
              {t.badge}
            </span>
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-4 leading-[1.2]">
              {t.title}
            </h1>
            <p className="text-[1.1rem] text-brand-gray-500 max-w-[560px] mx-auto leading-[1.7]">
              {t.subtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Kontakt info kortelės */}
      <section className="pb-16 bg-white">
        <Container>
          <div
            className={`grid ${CONTACT.phone ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-6`}
          >
            {[
              {
                icon: '✉',
                title: t.email,
                value: CONTACT.email,
                href: `mailto:${CONTACT.email}`,
              },
              ...(CONTACT.phone
                ? [
                    {
                      icon: '☎',
                      title: t.phone,
                      value: CONTACT.phone,
                      href: phoneHref,
                    },
                  ]
                : []),
              {
                icon: '📍',
                title: t.address,
                value: CONTACT.address,
              },
              {
                icon: '🕓',
                title: t.workingHours,
                value: CONTACT.workingHours,
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-brand-gray-50 rounded-xl p-8 px-6 text-center border border-transparent hover:border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] flex items-center justify-center text-[1.4rem] mx-auto mb-4">
                  <span aria-hidden>{card.icon}</span>
                </div>
                <h4 className="text-base font-bold text-brand-gray-900 mb-2">
                  {card.title}
                </h4>
                {card.href ? (
                  <a
                    href={card.href}
                    className="text-[0.92rem] text-brand-blue font-medium hover:text-brand-magenta transition-colors break-all"
                  >
                    {card.value}
                  </a>
                ) : (
                  <p className="text-[0.92rem] text-brand-gray-500">
                    {card.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Kontakt form + info */}
      <section className="py-20 bg-brand-gray-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-[60px] items-start">
            {/* Info */}
            <div>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-4 leading-tight">
                {t.writeToUs}
              </h2>
              <p className="text-[1.05rem] text-brand-gray-500 leading-[1.7] mb-8">
                {t.formSubtitle}
              </p>

              <div className="grid gap-3.5 mb-10">
                {[t.feature1, t.feature2, t.feature3].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-[0.95rem] text-brand-gray-900 font-medium"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-magenta/10 text-brand-magenta flex items-center justify-center text-[0.85rem] font-bold flex-shrink-0">
                      ✓
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div className="pt-2">
                <h4 className="text-base font-bold text-brand-gray-900 mb-4">
                  {t.followUs}
                </h4>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: 'Facebook', href: 'https://www.facebook.com/dazaikirpejams' },
                    { label: 'Instagram', href: 'https://www.instagram.com/dazaikirpejams' },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E0E0E0] bg-white text-[0.9rem] font-medium text-brand-gray-900 hover:border-brand-magenta hover:text-brand-magenta hover:shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all"
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-xl p-8 lg:p-10 shadow-[0_2px_16px_rgba(0,0,0,0.07)] border border-[#E0E0E0]">
              <ContactForm lang={lang} labels={t} />
            </div>
          </div>
        </Container>
      </section>

      {/* Žemėlapis */}
      <section className="pb-20 bg-brand-gray-50">
        <Container>
          <iframe
            title="Dažai Kirpėjams — Taikos pr. 32, Kaunas"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2294.8!2d23.9415!3d54.8985!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46e7187b3b3f0001%3A0x1!2sTaikos+pr.+32%2C+Kaunas!5e0!3m2!1slt!2slt!4v1"
            className="w-full h-[280px] lg:h-[380px] rounded-xl border border-[#E0E0E0]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </Container>
      </section>

      {/* Greitos nuorodos */}
      <section className="py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                href: `${p}/duk`,
                icon: '❓',
                title: t.faqTitle,
                desc: t.faqDesc,
              },
              {
                href: `${p}/pristatymas`,
                icon: '🚚',
                title: t.deliveryTitle,
                desc: t.deliveryDesc,
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-5 p-7 px-8 bg-brand-gray-50 rounded-xl border border-transparent hover:border-brand-magenta hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-0.5 transition-all"
              >
                <div className="w-[52px] h-[52px] rounded-xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] flex items-center justify-center text-[1.5rem] flex-shrink-0">
                  <span aria-hidden>{link.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-[1.05rem] font-bold text-brand-gray-900 mb-1.5 group-hover:text-brand-magenta transition-colors">
                    {link.title}
                  </h4>
                  <p className="text-[0.88rem] text-brand-gray-500 leading-[1.5]">
                    {link.desc}
                  </p>
                </div>
                <span
                  className="text-[1.3rem] text-brand-gray-500 group-hover:text-brand-magenta group-hover:translate-x-1 transition-all flex-shrink-0"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

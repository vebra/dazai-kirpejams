import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale, getDictionary } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { LegalContent } from '@/components/ui/LegalContent'
import { buildPageMetadata, buildCanonicalUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { langPrefix } from '@/lib/utils'

export const revalidate = 300

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pirkimo-salygos'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/pirkimo-salygos',
    title: 'Pirkimo sąlygos',
    description:
      'Bendrosios pirkimo–pardavimo taisyklės ir sąlygos www.dazaikirpejams.lt elektroninėje parduotuvėje.',
  })
}

export default async function TermsPage({
  params,
}: PageProps<'/[lang]/pirkimo-salygos'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: dict.common.home, url: buildCanonicalUrl(lang, '/') },
        { name: dict.nav.terms, url: buildCanonicalUrl(lang, '/pirkimo-salygos') },
      ])} />
      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${langPrefix(lang) || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            {dict.common.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">
            {dict.nav.terms}
          </span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {dict.common.legalBadge}
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
            {dict.nav.terms}
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto">
            Bendrosios pirkimo–pardavimo taisyklės www.dazaikirpejams.lt
            elektroninėje parduotuvėje.
          </p>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-[820px] mx-auto bg-white rounded-2xl p-8 lg:p-12 border border-[#E0E0E0] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <LegalContent>
              <h2>1. Bendrosios nuostatos</h2>
              <p>
                Šios pirkimo taisyklės yra teisinis dokumentas, kuris nustato
                pirkėjo ir pardavėjo tarpusavio teises, pareigas ir atsakomybę
                pirkėjui įsigyjant prekes elektroninėje parduotuvėje{' '}
                <strong>www.dazaikirpejams.lt</strong>.
              </p>

              <h2>2. Pardavėjas</h2>
              <p>
                Elektroninės parduotuvės administratorius ir pardavėjas —
                Dažai Kirpėjams, veikianti pagal LR įstatymus.
              </p>

              <h2>3. Pirkimo-pardavimo sutarties sudarymas</h2>
              <p>
                Pirkimo-pardavimo sutartis tarp pirkėjo ir pardavėjo laikoma
                sudaryta tada, kai pirkėjas, išsirinkęs prekes ir sudaręs
                krepšelį, paspaudžia nuorodą „Patvirtinti užsakymą" ir sumoka
                už prekes.
              </p>

              <h2>4. Kainos ir mokėjimas</h2>
              <p>
                Prekių kainos nurodytos su PVM. Galutinė suma apskaičiuojama
                krepšelyje, pridėjus pristatymo mokestį, jei jis taikomas.
              </p>
              <p>Priimami mokėjimo būdai:</p>
              <ul>
                <li>Banko pavedimas</li>
                <li>Mokėjimo kortelės (Visa, Mastercard)</li>
                <li>Paysera</li>
              </ul>

              <h2>5. Pristatymas</h2>
              <p>
                Pristatymo sąlygos nurodytos{' '}
                <a href="/lt/pristatymas">Pristatymo ir grąžinimo</a>{' '}
                puslapyje. Užsakymai pristatomi per 1–3 darbo dienas nuo
                apmokėjimo patvirtinimo.
              </p>

              <h2>6. Sutarties atsisakymas</h2>
              <p>
                Pirkėjas turi teisę atsisakyti pirkimo–pardavimo sutarties per
                14 dienų nuo prekės gavimo dienos, pranešdamas apie tai
                pardavėjui el. paštu.
              </p>

              <h2>7. Garantija</h2>
              <p>
                Visoms parduodamoms prekėms taikoma gamintojo garantija pagal
                LR teisės aktus. Brokuotos prekės keičiamos nemokamai.
              </p>

              <h2>8. Atsakomybės apribojimas</h2>
              <p>
                Pardavėjas neatsako už žalą, atsiradusią dėl netinkamo prekės
                naudojimo ar nepaisant instrukcijų. Pirkėjas prisiima
                atsakomybę už teisingą prekės naudojimą pagal jos paskirtį.
              </p>

              <h2>9. Ginčų sprendimas</h2>
              <p>
                Ginčai sprendžiami derybomis. Nepavykus susitarti — LR
                įstatymų nustatyta tvarka. Vartotojai gali kreiptis į
                Valstybinę vartotojų teisių apsaugos tarnybą (
                <a
                  href="https://www.vvtat.lt"
                  target="_blank"
                  rel="noreferrer"
                >
                  www.vvtat.lt
                </a>
                ).
              </p>

              <h2>10. Baigiamosios nuostatos</h2>
              <p>
                Pardavėjas pasilieka teisę keisti šias taisykles. Pasikeitimai
                įsigalioja nuo jų paskelbimo svetainėje dienos.
              </p>
            </LegalContent>
          </div>
        </Container>
      </section>
    </>
  )
}

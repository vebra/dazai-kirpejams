import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { LegalContent } from '@/components/ui/LegalContent'
import { buildPageMetadata } from '@/lib/seo'
import { langPrefix } from '@/lib/utils'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/privatumo-politika'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  return buildPageMetadata({
    lang,
    path: '/privatumo-politika',
    title: 'Privatumo politika',
    description:
      'Informacija apie jūsų asmens duomenų tvarkymą pagal BDAR reikalavimus.',
  })
}

export default async function PrivacyPage({
  params,
}: PageProps<'/[lang]/privatumo-politika'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

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
            Privatumo politika
          </span>
        </Container>
      </section>

      {/* Hero */}
      <section className="py-12 lg:py-20 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] text-center">
        <Container>
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Teisinė informacija
          </span>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold text-brand-gray-900 mb-5 leading-[1.2]">
            Privatumo politika
          </h1>
          <p className="text-[1.15rem] text-brand-gray-500 leading-[1.7] max-w-[720px] mx-auto">
            Informacija apie jūsų asmens duomenų tvarkymą pagal BDAR
            reikalavimus.
          </p>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-[820px] mx-auto bg-white rounded-2xl p-8 lg:p-12 border border-[#E0E0E0] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <LegalContent>
              <h2>1. Duomenų valdytojas</h2>
              <p>
                Asmens duomenų valdytojas yra Dažai Kirpėjams, veikianti pagal
                Lietuvos Respublikos įstatymus. Kontaktai:{' '}
                <a href="mailto:info@dazaikirpejams.lt">
                  info@dazaikirpejams.lt
                </a>
                .
              </p>

              <h2>2. Kokius duomenis renkame</h2>
              <p>Rinksime šiuos asmens duomenis:</p>
              <ul>
                <li>Vardas, pavardė</li>
                <li>El. pašto adresas</li>
                <li>Telefono numeris</li>
                <li>Pristatymo adresas</li>
                <li>Įmonės rekvizitai (B2B klientams)</li>
                <li>Užsakymų istorija</li>
                <li>IP adresas ir naršymo duomenys (slapukai)</li>
              </ul>

              <h2>3. Duomenų tvarkymo tikslai</h2>
              <p>Jūsų asmens duomenis tvarkome šiais tikslais:</p>
              <ul>
                <li>Užsakymų vykdymas ir pristatymas</li>
                <li>Sąskaitų faktūrų išrašymas</li>
                <li>Klientų aptarnavimas</li>
                <li>Tiesioginė rinkodara (su jūsų sutikimu)</li>
                <li>Teisinių įsipareigojimų vykdymas</li>
              </ul>

              <h2>4. Duomenų saugojimo terminas</h2>
              <p>
                Asmens duomenis saugome tiek, kiek reikalinga nurodytiems
                tikslams pasiekti, bet ne ilgiau nei numato LR teisės aktai.
                Užsakymų duomenys saugomi 10 metų apskaitos reikalavimams
                vykdyti.
              </p>

              <h2>5. Slapukai</h2>
              <p>
                Svetainėje naudojame slapukus (cookies), kurie padeda gerinti
                vartotojo patirtį, analizuoti svetainės veiklą ir pritaikyti
                turinį. Galite bet kada pakeisti slapukų nustatymus savo
                naršyklėje.
              </p>

              <h2>6. Duomenų perdavimas tretiesiems asmenims</h2>
              <p>Jūsų duomenys gali būti perduoti:</p>
              <ul>
                <li>Pristatymo paslaugų teikėjams (kurjeriams)</li>
                <li>Mokėjimų apdorojimo platformoms (Stripe, Paysera)</li>
                <li>
                  Valstybinėms institucijoms (pagal teisinius reikalavimus)
                </li>
              </ul>

              <h2>7. Jūsų teisės</h2>
              <p>Turite teisę:</p>
              <ul>
                <li>Sužinoti, kokius jūsų duomenis tvarkome</li>
                <li>Prašyti duomenų ištaisymo</li>
                <li>Prašyti duomenų ištrynimo</li>
                <li>Atšaukti sutikimą bet kuriuo metu</li>
                <li>
                  Pateikti skundą Valstybinei duomenų apsaugos inspekcijai
                </li>
              </ul>

              <h2>8. Kontaktai</h2>
              <p>
                Klausimais dėl asmens duomenų tvarkymo kreipkitės el. paštu:{' '}
                <a href="mailto:info@dazaikirpejams.lt">
                  info@dazaikirpejams.lt
                </a>
                .
              </p>
            </LegalContent>
          </div>
        </Container>
      </section>
    </>
  )
}

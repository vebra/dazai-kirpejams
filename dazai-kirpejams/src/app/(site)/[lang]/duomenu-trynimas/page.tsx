import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { buildPageMetadata, buildCanonicalUrl } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import { langPrefix } from '@/lib/utils'

export const revalidate = 86400

type Lang = 'lt' | 'en' | 'ru'

const COPY: Record<
  Lang,
  {
    metaTitle: string
    metaDesc: string
    breadcrumb: string
    home: string
    title: string
    intro: string
    stepsTitle: string
    steps: string[]
    processingTitle: string
    processingBody: string
    altTitle: string
    altBody: string
    contactTitle: string
    contactBody: string
    privacyLink: string
  }
> = {
  lt: {
    metaTitle: 'Duomenų ištrynimas',
    metaDesc:
      'Kaip prašyti, kad mes ištrintume jūsų asmens duomenis iš Dažai Kirpėjams sistemos. GDPR teisės įgyvendinimo instrukcijos.',
    breadcrumb: 'Duomenų ištrynimas',
    home: 'Pradžia',
    title: 'Duomenų ištrynimas',
    intro:
      'Pagal Bendrąjį duomenų apsaugos reglamentą (BDAR / GDPR), jūs turite teisę bet kuriuo metu prašyti, kad mes ištrintume jūsų asmens duomenis iš mūsų sistemos. Žemiau — konkretūs žingsniai, kaip pateikti tokį prašymą.',
    stepsTitle: 'Kaip pateikti prašymą',
    steps: [
      'Parašykite el. laišką adresu info@dazaikirpejams.lt arba info@dziuljetavebre.lt',
      'Temos eilutėje įrašykite: „Duomenų ištrynimo prašymas" (arba „Data deletion request")',
      'Laiške nurodykite: vardą, pavardę ir el. paštą, su kuriuo registravotės arba pirkote',
      'Jei prisijungėte per Google/Facebook — nurodykite tai laiške',
    ],
    processingTitle: 'Per kiek laiko atliksime',
    processingBody:
      'Prašymą apdorosime per 30 kalendorinių dienų nuo gavimo dienos (pagal BDAR 12 str. 3 d.). Jei prašymas sudėtingas arba gausime daug prašymų vienu metu, terminas gali būti pratęstas iki 60 dienų — apie tai jus informuosime atskirai.',
    altTitle: 'Ką ištrinsime',
    altBody:
      'Ištrinsime visus jūsų asmens duomenis, kuriuos turime: paskyros informaciją, pirkimo istoriją, naujienlaiškio prenumeratą, kontaktinių formų pateiktus duomenis. Apskaitos dokumentai, kuriuos privalome saugoti pagal LR Buhalterinės apskaitos įstatymą (10 metų), bus saugomi tol, kol nesibaigs įstatyminis terminas.',
    contactTitle: 'Klausimai',
    contactBody:
      'Jei turite klausimų apie tai, kokius duomenis renkame ar kaip juos tvarkome, susisiekite su mumis aukščiau nurodytais kontaktais arba peržiūrėkite mūsų pilną privatumo politiką.',
    privacyLink: 'Pilna privatumo politika →',
  },
  en: {
    metaTitle: 'User Data Deletion',
    metaDesc:
      'How to request deletion of your personal data from Dažai Kirpėjams. GDPR rights implementation instructions.',
    breadcrumb: 'User Data Deletion',
    home: 'Home',
    title: 'User Data Deletion',
    intro:
      'Under the General Data Protection Regulation (GDPR), you have the right to request that we delete your personal data from our system at any time. Below are the steps to submit such a request.',
    stepsTitle: 'How to submit a request',
    steps: [
      'Send an email to info@dazaikirpejams.lt or info@dziuljetavebre.lt',
      'In the subject line write: “Data deletion request”',
      'Include in the email: your full name and the email address you used to register or place an order',
      'If you signed in via Google or Facebook — mention that in the email',
    ],
    processingTitle: 'How long it takes',
    processingBody:
      'We will process your request within 30 calendar days of receipt (per GDPR Article 12(3)). If the request is complex or we receive many at once, the period may be extended up to 60 days — we will notify you separately.',
    altTitle: 'What we will delete',
    altBody:
      'We will delete all personal data we hold about you: account information, purchase history, newsletter subscription, contact form submissions. Accounting records that we are legally required to keep (10 years under Lithuanian Accounting Law) will be retained until the statutory term expires.',
    contactTitle: 'Questions',
    contactBody:
      'If you have questions about what data we collect or how we handle it, contact us using the addresses above or review our full privacy policy.',
    privacyLink: 'Full privacy policy →',
  },
  ru: {
    metaTitle: 'Удаление данных пользователя',
    metaDesc:
      'Как запросить удаление ваших персональных данных из Dažai Kirpėjams. Инструкции реализации прав GDPR.',
    breadcrumb: 'Удаление данных',
    home: 'Главная',
    title: 'Удаление данных пользователя',
    intro:
      'В соответствии с Общим регламентом по защите данных (GDPR), вы имеете право в любое время потребовать удаления ваших персональных данных из нашей системы. Ниже — конкретные шаги для подачи такого запроса.',
    stepsTitle: 'Как подать запрос',
    steps: [
      'Напишите письмо на адрес info@dazaikirpejams.lt или info@dziuljetavebre.lt',
      'В теме письма укажите: «Запрос на удаление данных» (или «Data deletion request»)',
      'В письме укажите: имя, фамилию и email, с которым вы регистрировались или совершали покупки',
      'Если вы входили через Google/Facebook — укажите это в письме',
    ],
    processingTitle: 'Сроки обработки',
    processingBody:
      'Мы обработаем запрос в течение 30 календарных дней с момента получения (ст. 12(3) GDPR). Если запрос сложный или поступило много запросов одновременно, срок может быть продлён до 60 дней — мы уведомим вас отдельно.',
    altTitle: 'Что мы удалим',
    altBody:
      'Мы удалим все ваши персональные данные: информацию аккаунта, историю покупок, подписку на рассылку, данные из контактных форм. Бухгалтерские документы, которые мы обязаны хранить по Закону Литвы о бухгалтерском учёте (10 лет), будут сохранены до истечения этого срока.',
    contactTitle: 'Вопросы',
    contactBody:
      'Если у вас есть вопросы о том, какие данные мы собираем или как мы их обрабатываем, свяжитесь с нами по указанным выше адресам или ознакомьтесь с полной политикой конфиденциальности.',
    privacyLink: 'Полная политика конфиденциальности →',
  },
}

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const t = COPY[lang as Lang]
  return {
    ...buildPageMetadata({
      lang,
      path: '/duomenu-trynimas',
      title: t.metaTitle,
      description: t.metaDesc,
    }),
    robots: { index: true, follow: true },
  }
}

export default async function DataDeletionPage({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const t = COPY[lang as Lang]
  const p = langPrefix(lang)

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: t.home, url: buildCanonicalUrl(lang, '/') },
          { name: t.breadcrumb, url: buildCanonicalUrl(lang, '/duomenu-trynimas') },
        ])}
      />

      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${p || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            {t.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">{t.breadcrumb}</span>
        </Container>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-20 bg-white">
        <Container>
          <div className="max-w-[760px] mx-auto">
            <h1 className="text-[clamp(1.85rem,4.5vw,2.85rem)] font-bold text-brand-gray-900 mb-6 leading-[1.2]">
              {t.title}
            </h1>

            <p className="text-[1.05rem] leading-[1.75] text-brand-gray-700 mb-10">
              {t.intro}
            </p>

            <h2 className="text-[1.4rem] font-bold text-brand-gray-900 mb-4 leading-tight">
              {t.stepsTitle}
            </h2>
            <ol className="list-decimal pl-5 space-y-3 mb-10 text-[1rem] leading-[1.75] text-brand-gray-700">
              {t.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <h2 className="text-[1.4rem] font-bold text-brand-gray-900 mb-4 leading-tight">
              {t.processingTitle}
            </h2>
            <p className="text-[1rem] leading-[1.75] text-brand-gray-700 mb-10">
              {t.processingBody}
            </p>

            <h2 className="text-[1.4rem] font-bold text-brand-gray-900 mb-4 leading-tight">
              {t.altTitle}
            </h2>
            <p className="text-[1rem] leading-[1.75] text-brand-gray-700 mb-10">
              {t.altBody}
            </p>

            <h2 className="text-[1.4rem] font-bold text-brand-gray-900 mb-4 leading-tight">
              {t.contactTitle}
            </h2>
            <p className="text-[1rem] leading-[1.75] text-brand-gray-700 mb-6">
              {t.contactBody}
            </p>
            <Link
              href={`${p}/privatumo-politika`}
              className="inline-block text-brand-magenta font-semibold hover:underline"
            >
              {t.privacyLink}
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}

import 'server-only'

/**
 * HTML email templates registracijos srautui.
 * - Welcome email vartotojui
 * - Admin notification apie naują registraciją (kad galėtų greitai verifikuoti)
 *
 * Tas pats dizaino principų rinkinys kaip ir `templates.ts` (inline CSS,
 * lentelinis layout'as, 600px max plotis).
 */

const BRAND_MAGENTA = '#E91E8C'
const GRAY_900 = '#1A1A1A'
const GRAY_500 = '#6B6B6B'
const GRAY_50 = '#F5F5F7'
const BORDER = '#eeeeee'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const BUSINESS_TYPE_LT: Record<string, string> = {
  hairdresser: 'Kirpėjas',
  colorist: 'Koloristas',
  salon_owner: 'Salono savininkas',
  salon: 'Salono savininkas',
  student: 'Studentas',
  other: 'Kita',
}

// ============================================
// WELCOME EMAIL — vartotojui po registracijos
// ============================================

export type WelcomeEmailInput = {
  firstName: string
  lang: 'lt' | 'en' | 'ru'
  siteUrl: string
}

const WELCOME_COPY = {
  lt: {
    subject: 'Sveiki atvykę į Dažai Kirpėjams',
    preheader: 'Jūsų registracija gauta — laukiame patvirtinimo, kad atidengtume kainas.',
    badge: 'Registracija sėkminga',
    title: (name: string) => `Sveiki, ${name}!`,
    intro:
      'Ačiū, kad pasirinkote Dažai Kirpėjams. Jūsų paskyra sukurta, ir mes peržiūrėsime registracijos duomenis per artimiausias 24 valandas.',
    pendingTitle: 'Kas vyksta toliau?',
    pendingDesc:
      'Kol patvirtinsime jūsų profesionalo statusą, kainos liks paslėptos. Kai tik patvirtinsime — gausite atskirą laišką ir galėsite naršyti pilną Color SHOCK katalogą su jūsų kainomis.',
    perksTitle: 'Tuo tarpu kviečiame:',
    perk1Title: 'Apsilankyti Color SHOCK prezentacijoje Kaune',
    perk1Desc:
      'Gegužės 17 d., 10:00–15:00. Gyva dažymo demonstracija su gyvu modeliu, profesionalūs patarimai. Įėjimas nemokamas.',
    perk1Cta: 'Registruotis į renginį',
    perk2Title: 'Aptarti individualias salono sąlygas',
    perk2Desc:
      'Jei dirbate salone arba turite reguliarų poreikį — galim suderinti specialias B2B kainas ir tiekimo planą.',
    perk2Cta: 'Salono pasiūlymas',
    closing:
      'Klausimai dėl registracijos arba produktų — atsakykite į šį laišką arba rašykite info@dziuljetavebre.lt.',
    signoff: 'Pagarbiai,\nDažai Kirpėjams komanda',
    footerSite: 'www.dazaikirpejams.lt',
  },
  en: {
    subject: 'Welcome to Dažai Kirpėjams',
    preheader:
      'Your registration is in — we are reviewing it so prices can be unlocked.',
    badge: 'Registration received',
    title: (name: string) => `Welcome, ${name}!`,
    intro:
      'Thank you for choosing Dažai Kirpėjams. Your account has been created, and we will review your registration within the next 24 hours.',
    pendingTitle: 'What happens next?',
    pendingDesc:
      'Until we verify your professional status, prices remain hidden. As soon as we approve — you will receive a separate email and gain full access to the Color SHOCK catalogue with your pricing.',
    perksTitle: 'In the meantime:',
    perk1Title: 'Join the Color SHOCK live demo in Kaunas',
    perk1Desc:
      'May 17, 10:00–15:00. Live colouring demonstration on a real model with professional commentary. Free entry.',
    perk1Cta: 'Register for the event',
    perk2Title: 'Discuss salon-specific terms',
    perk2Desc:
      'If you run a salon or have regular volume — we can arrange B2B pricing and a recurring supply plan.',
    perk2Cta: 'Salon offer',
    closing:
      'Questions about registration or products — reply to this email or write to info@dziuljetavebre.lt.',
    signoff: 'Kind regards,\nDažai Kirpėjams team',
    footerSite: 'www.dazaikirpejams.lt',
  },
  ru: {
    subject: 'Добро пожаловать в Dažai Kirpėjams',
    preheader:
      'Ваша регистрация получена — мы проверяем её, чтобы открыть цены.',
    badge: 'Регистрация получена',
    title: (name: string) => `Здравствуйте, ${name}!`,
    intro:
      'Спасибо, что выбрали Dažai Kirpėjams. Ваш аккаунт создан, мы рассмотрим данные регистрации в ближайшие 24 часа.',
    pendingTitle: 'Что дальше?',
    pendingDesc:
      'Пока мы подтверждаем ваш профессиональный статус, цены скрыты. Как только мы одобрим аккаунт — вы получите отдельное письмо и получите полный доступ к каталогу Color SHOCK с вашими ценами.',
    perksTitle: 'А пока приглашаем:',
    perk1Title: 'Прийти на презентацию Color SHOCK в Каунасе',
    perk1Desc:
      '17 мая, 10:00–15:00. Живая демонстрация окрашивания на модели с комментариями профессионала. Вход бесплатный.',
    perk1Cta: 'Зарегистрироваться на мероприятие',
    perk2Title: 'Обсудить условия для салона',
    perk2Desc:
      'Если вы работаете в салоне или у вас регулярный объём — мы можем согласовать B2B-цены и план поставок.',
    perk2Cta: 'Предложение для салона',
    closing:
      'Вопросы по регистрации или продуктам — ответьте на это письмо или напишите info@dziuljetavebre.lt.',
    signoff: 'С уважением,\nКоманда Dažai Kirpėjams',
    footerSite: 'www.dazaikirpejams.lt',
  },
} as const

export function buildWelcomeEmail(input: WelcomeEmailInput): {
  subject: string
  html: string
  text: string
} {
  const c = WELCOME_COPY[input.lang]
  const eventUrl = `${input.siteUrl}/lt/renginys`
  const salonUrl = `${input.siteUrl}/${input.lang}/salonams`
  const safeName = escapeHtml(input.firstName || '')

  const html = `<!doctype html>
<html lang="${input.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  ${escapeHtml(c.preheader)}
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr>
          <td style="padding:32px 32px 0;">
            <div style="display:inline-block;padding:6px 12px;background:${BRAND_MAGENTA};color:#ffffff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-radius:999px;">
              ${escapeHtml(c.badge)}
            </div>
            <h1 style="margin:20px 0 0;font-size:26px;font-weight:700;color:${GRAY_900};line-height:1.25;">
              ${escapeHtml(c.title(safeName))}
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 0;">
            <p style="margin:0;font-size:15px;line-height:1.7;color:${GRAY_500};">
              ${escapeHtml(c.intro)}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 0;">
            <div style="background:${GRAY_50};border-radius:12px;padding:20px 24px;">
              <div style="font-size:13px;font-weight:700;color:${GRAY_900};margin-bottom:6px;">
                ${escapeHtml(c.pendingTitle)}
              </div>
              <p style="margin:0;font-size:14px;line-height:1.65;color:${GRAY_500};">
                ${escapeHtml(c.pendingDesc)}
              </p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px 0;">
            <div style="font-size:13px;font-weight:700;color:${GRAY_900};margin-bottom:12px;">
              ${escapeHtml(c.perksTitle)}
            </div>

            <div style="border:1px solid ${BORDER};border-radius:12px;padding:18px 20px;margin-bottom:12px;">
              <div style="font-size:14px;font-weight:700;color:${GRAY_900};margin-bottom:6px;">
                ${escapeHtml(c.perk1Title)}
              </div>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${GRAY_500};">
                ${escapeHtml(c.perk1Desc)}
              </p>
              <a href="${eventUrl}" style="display:inline-block;padding:10px 18px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;border-radius:8px;">
                ${escapeHtml(c.perk1Cta)} →
              </a>
            </div>

            <div style="border:1px solid ${BORDER};border-radius:12px;padding:18px 20px;">
              <div style="font-size:14px;font-weight:700;color:${GRAY_900};margin-bottom:6px;">
                ${escapeHtml(c.perk2Title)}
              </div>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${GRAY_500};">
                ${escapeHtml(c.perk2Desc)}
              </p>
              <a href="${salonUrl}" style="display:inline-block;padding:10px 18px;background:#ffffff;color:${GRAY_900};border:1.5px solid ${GRAY_900};text-decoration:none;font-size:13px;font-weight:600;border-radius:8px;">
                ${escapeHtml(c.perk2Cta)} →
              </a>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0;font-size:13px;line-height:1.65;color:${GRAY_500};">
              ${escapeHtml(c.closing)}
            </p>
            <p style="margin:18px 0 0;font-size:13px;line-height:1.65;color:${GRAY_900};white-space:pre-line;">
              ${escapeHtml(c.signoff)}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 32px;">
            <div style="border-top:1px solid ${BORDER};padding-top:16px;font-size:11px;color:${GRAY_500};text-align:center;">
              ${escapeHtml(c.footerSite)}
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = `${c.title(input.firstName || '')}

${c.intro}

${c.pendingTitle}
${c.pendingDesc}

${c.perksTitle}
- ${c.perk1Title}
  ${c.perk1Desc}
  ${eventUrl}

- ${c.perk2Title}
  ${c.perk2Desc}
  ${salonUrl}

${c.closing}

${c.signoff}

${c.footerSite}`

  return { subject: c.subject, html, text }
}

// ============================================
// ADMIN NOTIFICATION — apie naują registraciją
// ============================================

export type AdminRegistrationEmailInput = {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string | null
  businessType: string | null
  salonName: string | null
  companyCode: string | null
  dailyDyesCount: string | null
  verificationNotes: string | null
  lang: string
  createdAt: string
  adminUrl: string
}

export function buildAdminRegistrationEmail(
  input: AdminRegistrationEmailInput
): { subject: string; html: string; text: string } {
  const fullName = `${input.firstName} ${input.lastName}`.trim()
  const subject = `Nauja registracija · ${fullName || input.email}`
  const businessLabel = input.businessType
    ? BUSINESS_TYPE_LT[input.businessType] ?? input.businessType
    : '—'

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;width:42%;border-top:1px solid ${BORDER};">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">${value || '—'}</td>
    </tr>`

  const html = `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Nauja registracija laukia patvirtinimo · ${escapeHtml(input.email)}
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr>
          <td style="padding:24px 32px;background:${BRAND_MAGENTA};">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.85);">
              Admin · Nauja registracija
            </div>
            <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:4px;">
              ${escapeHtml(fullName || input.email)}
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;width:42%;">Pateikta</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;">${escapeHtml(new Intl.DateTimeFormat('lt-LT', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(input.createdAt)))}</td>
              </tr>
              ${row('El. paštas', `<a href="mailto:${escapeHtml(input.email)}" style="color:${BRAND_MAGENTA};text-decoration:none;">${escapeHtml(input.email)}</a>`)}
              ${row('Telefonas', input.phone ? `<a href="tel:${escapeHtml(input.phone)}" style="color:${BRAND_MAGENTA};text-decoration:none;">${escapeHtml(input.phone)}</a>` : '')}
              ${row('Miestas', escapeHtml(input.city ?? ''))}
              ${row('Vaidmuo', escapeHtml(businessLabel))}
              ${row('Salono pavadinimas', escapeHtml(input.salonName ?? ''))}
              ${row('Įmonės kodas', escapeHtml(input.companyCode ?? ''))}
              ${row('Dažymai per dieną', escapeHtml(input.dailyDyesCount ?? ''))}
              ${row('Kalba', escapeHtml(input.lang.toUpperCase()))}
            </table>
          </td>
        </tr>

        ${
          input.verificationNotes
            ? `
        <tr>
          <td style="padding:16px 32px 0;">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:8px;">
              Pastabos verifikacijai
            </div>
            <div style="background:${GRAY_50};border-radius:12px;padding:16px 20px;font-size:14px;color:${GRAY_900};line-height:1.6;white-space:pre-wrap;">
              ${escapeHtml(input.verificationNotes)}
            </div>
          </td>
        </tr>`
            : ''
        }

        <tr>
          <td style="padding:24px 32px 32px;">
            <a href="${input.adminUrl}" style="display:inline-block;padding:12px 24px;background:${GRAY_900};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">
              Patvirtinti registraciją admin'e →
            </a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = `Nauja registracija
${fullName || input.email}
Pateikta: ${new Date(input.createdAt).toLocaleString('lt-LT')}

El. paštas: ${input.email}
Telefonas: ${input.phone || '—'}
Miestas: ${input.city ?? '—'}
Vaidmuo: ${businessLabel}
Salono pavadinimas: ${input.salonName ?? '—'}
Įmonės kodas: ${input.companyCode ?? '—'}
Dažymai per dieną: ${input.dailyDyesCount ?? '—'}
Kalba: ${input.lang.toUpperCase()}

${input.verificationNotes ? `Pastabos:\n${input.verificationNotes}\n` : ''}
Admin: ${input.adminUrl}`

  return { subject, html, text }
}

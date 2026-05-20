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
    subject: 'Jūsų paskyra patvirtinta — kainos atvertos',
    preheader: 'Profesionalo statusas patvirtintas. Kainos jau matomos — galite pirkti.',
    badge: 'Patvirtinta',
    title: (name: string) => `Sveiki, ${name}! Jūsų prieiga atidaryta`,
    intro:
      'Ačiū, kad pasirinkote Dažai Kirpėjams. Jūsų profesionalo statusas patvirtintas — nuo šiol matote visas kainas ir galite užsisakyti pilną Color SHOCK asortimentą.',
    pendingTitle: 'Galite pradėti',
    pendingDesc:
      'Prisijunkite prie paskyros ir naršykite katalogą su jums matomomis profesionalų kainomis. Užsakymai pristatomi įprasta tvarka.',
    ctaCatalog: 'Peržiūrėti katalogą',
    perksTitle: 'Taip pat kviečiame:',
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
    subject: 'Your account is approved — prices unlocked',
    preheader:
      'Professional status confirmed. Prices are now visible — you can order.',
    badge: 'Approved',
    title: (name: string) => `Welcome, ${name}! Your access is open`,
    intro:
      'Thank you for choosing Dažai Kirpėjams. Your professional status is confirmed — you now see all prices and can order the full Color SHOCK range.',
    pendingTitle: 'You are ready to go',
    pendingDesc:
      'Sign in to your account and browse the catalogue with your professional pricing. Orders are shipped as usual.',
    ctaCatalog: 'Browse the catalogue',
    perksTitle: 'We also invite you to:',
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
    subject: 'Ваш аккаунт подтверждён — цены открыты',
    preheader:
      'Профессиональный статус подтверждён. Цены видны — можно заказывать.',
    badge: 'Подтверждено',
    title: (name: string) => `Здравствуйте, ${name}! Доступ открыт`,
    intro:
      'Спасибо, что выбрали Dažai Kirpėjams. Ваш профессиональный статус подтверждён — теперь вы видите все цены и можете заказать весь ассортимент Color SHOCK.',
    pendingTitle: 'Можно начинать',
    pendingDesc:
      'Войдите в аккаунт и просматривайте каталог с профессиональными ценами. Заказы доставляются в обычном порядке.',
    ctaCatalog: 'Открыть каталог',
    perksTitle: 'Также приглашаем:',
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
  const salonUrl = `${input.siteUrl}/${input.lang}/salonams`
  const catalogUrl = `${input.siteUrl}/${input.lang}/produktai`
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
              <p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:${GRAY_500};">
                ${escapeHtml(c.pendingDesc)}
              </p>
              <a href="${catalogUrl}" style="display:inline-block;padding:11px 20px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">
                ${escapeHtml(c.ctaCatalog)} →
              </a>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px 0;">
            <div style="font-size:13px;font-weight:700;color:${GRAY_900};margin-bottom:12px;">
              ${escapeHtml(c.perksTitle)}
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
${c.ctaCatalog}: ${catalogUrl}

${c.perksTitle}
- ${c.perk2Title}
  ${c.perk2Desc}
  ${salonUrl}

${c.closing}

${c.signoff}

${c.footerSite}`

  return { subject: c.subject, html, text }
}

// ============================================
// REGISTRACIJA GAUTA — laukia admin patvirtinimo
// ============================================

const PENDING_COPY = {
  lt: {
    subject: 'Registracija gauta — laukia patvirtinimo',
    preheader:
      'Gavome Jūsų registraciją. Patikrinsime profesionalo statusą ir pranešime el. paštu.',
    badge: 'Laukia patvirtinimo',
    title: (name: string) =>
      name ? `Ačiū, ${name}! Registraciją gavome` : 'Registraciją gavome',
    body1:
      'Jūsų paskyra sukurta. Kadangi parduotuvė skirta tik profesionalams, registraciją peržiūri mūsų komanda.',
    body2:
      'Patvirtinus, gausite atskirą laišką ir kainos taps matomos — galėsite užsisakyti pilną Color SHOCK asortimentą. Peržiūra paprastai trunka iki 1 darbo dienos.',
    closing:
      'Klausimai — atsakykite į šį laišką arba rašykite info@dziuljetavebre.lt.',
    signoff: 'Pagarbiai,\nDažai Kirpėjams komanda',
  },
  en: {
    subject: 'Registration received — pending approval',
    preheader:
      'We received your registration. We will verify your professional status and notify you by email.',
    badge: 'Pending approval',
    title: (name: string) =>
      name
        ? `Thank you, ${name}! Registration received`
        : 'Registration received',
    body1:
      'Your account has been created. As this store is for professionals only, our team reviews each registration.',
    body2:
      'Once approved, you will receive a separate email and prices will become visible — you will be able to order the full Color SHOCK range. Review usually takes up to 1 business day.',
    closing:
      'Questions — reply to this email or write to info@dziuljetavebre.lt.',
    signoff: 'Best regards,\nDažai Kirpėjams team',
  },
  ru: {
    subject: 'Регистрация получена — ожидает подтверждения',
    preheader:
      'Мы получили вашу регистрацию. Проверим профессиональный статус и сообщим по электронной почте.',
    badge: 'Ожидает подтверждения',
    title: (name: string) =>
      name
        ? `Спасибо, ${name}! Регистрация получена`
        : 'Регистрация получена',
    body1:
      'Ваша учётная запись создана. Так как магазин предназначен только для профессионалов, каждую регистрацию проверяет наша команда.',
    body2:
      'После подтверждения вы получите отдельное письмо, и цены станут видимыми — вы сможете заказать весь ассортимент Color SHOCK. Проверка обычно занимает до 1 рабочего дня.',
    closing:
      'Вопросы — ответьте на это письмо или напишите на info@dziuljetavebre.lt.',
    signoff: 'С уважением,\nкоманда Dažai Kirpėjams',
  },
} as const

export type RegistrationPendingEmailInput = {
  firstName: string
  lang: 'lt' | 'en' | 'ru'
  siteUrl: string
}

export function buildRegistrationPendingEmail(
  input: RegistrationPendingEmailInput
): { subject: string; html: string; text: string } {
  const c = PENDING_COPY[input.lang] ?? PENDING_COPY.lt
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
            <div style="display:inline-block;padding:6px 12px;background:${GRAY_900};color:#ffffff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-radius:999px;">
              ${escapeHtml(c.badge)}
            </div>
            <h1 style="margin:20px 0 0;font-size:26px;font-weight:700;color:${GRAY_900};line-height:1.25;">
              ${escapeHtml(c.title(safeName))}
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 0;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:${GRAY_500};">
              ${escapeHtml(c.body1)}
            </p>
            <p style="margin:0;font-size:15px;line-height:1.7;color:${GRAY_500};">
              ${escapeHtml(c.body2)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px;border-top:1px solid ${BORDER};margin-top:24px;">
            <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${GRAY_500};">
              ${escapeHtml(c.closing)}
            </p>
            <p style="margin:14px 0 0;font-size:12px;color:${GRAY_500};white-space:pre-line;">
              ${escapeHtml(c.signoff)}
            </p>
            <p style="margin:12px 0 0;font-size:12px;">
              <a href="${input.siteUrl}" style="color:${BRAND_MAGENTA};text-decoration:none;">${escapeHtml(input.siteUrl.replace(/^https?:\/\//, ''))}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = `${c.title(input.firstName || '')}

${c.body1}

${c.body2}

${c.closing}

${c.signoff}

${input.siteUrl.replace(/^https?:\/\//, '')}`

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
  const subject = `Naujas profesionalas — laukia patvirtinimo · ${fullName || input.email}`
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
  Naujas profesionalas auto-patvirtintas — patikrinkite, jei įtartina · ${escapeHtml(input.email)}
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr>
          <td style="padding:24px 32px;background:${BRAND_MAGENTA};">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.85);">
              Admin · Naujas profesionalas (auto-patvirtintas)
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
              Peržiūrėti profesionalų sąrašą →
            </a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = `Naujas profesionalas (auto-patvirtintas)
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

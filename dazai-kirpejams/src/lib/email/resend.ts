import 'server-only'
import { Resend } from 'resend'

/**
 * Resend klientas email notifikacijoms.
 *
 * Aplinkos kintamieji:
 *   RESEND_API_KEY              — API raktas iš resend.com dashboard'o
 *   RESEND_FROM                 — siuntėjas, pvz. `Dažai Kirpėjams <info@dziuljetavebre.lt>`
 *                                 privalo būti iš verified domain'o
 *   ADMIN_NOTIFICATION_EMAIL    — į kurį adresą siųsti "naujas užsakymas" pranešimus
 *
 * Defensyvus dizainas: jei API raktas nesukonfigūruotas (dev aplinka, testai),
 * `sendEmail` silent'iškai grąžina `{ ok: false, reason: 'not-configured' }` ir
 * rašo warning'ą į konsolę. NESUGRIŪNA užsakymo srauto — tai svarbu, nes
 * checkout neturi lūžti dėl email'o problemų.
 */

const apiKey = process.env.RESEND_API_KEY
const fromAddress = process.env.RESEND_FROM
const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
const b2bEmail = process.env.B2B_NOTIFICATION_EMAIL

export const isResendConfigured = Boolean(
  apiKey &&
    fromAddress &&
    !apiKey.includes('xxxxxxxx') &&
    !apiKey.startsWith('your-')
)

// Lazy init'as — tik vienąkart per server'io gyvavimą
let resendClient: Resend | null = null
function getClient(): Resend | null {
  if (!isResendConfigured) return null
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export type EmailAttachment = {
  filename: string
  content: Buffer
  contentType?: string
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'not-configured' | 'send-failed'; error?: string }

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getClient()
  if (!client || !fromAddress) {
    console.warn(
      '[email] Resend not configured — skipping email to',
      Array.isArray(input.to) ? input.to.join(', ') : input.to
    )
    return { ok: false, reason: 'not-configured' }
  }

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })

    if (error || !data) {
      console.error('[email] Resend send error:', error)
      return {
        ok: false,
        reason: 'send-failed',
        error: error?.message ?? 'Unknown error',
      }
    }

    return { ok: true, id: data.id }
  } catch (err) {
    console.error('[email] Resend exception:', err)
    return {
      ok: false,
      reason: 'send-failed',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/** Admin email — naudoti "naujas užsakymas" pranešimams */
export function getAdminNotificationEmail(): string | null {
  return adminEmail && !adminEmail.includes('xxxxxxxx') ? adminEmail : null
}

/**
 * B2B email — atskiras srautas nuo užsakymų, nes salonų užklausos gali eiti
 * kitam asmeniui/adresui nei e-shop notifikacijos. Jei `B2B_NOTIFICATION_EMAIL`
 * nenustatytas, fallback'as į `ADMIN_NOTIFICATION_EMAIL`.
 */
export function getB2bNotificationEmail(): string | null {
  if (b2bEmail && !b2bEmail.includes('xxxxxxxx')) return b2bEmail
  return getAdminNotificationEmail()
}

import { z } from 'zod'

/**
 * Zod schemos auth srautui. Klaidos pranešimo string'as = dictionary
 * raktas (errors.xxx) — action'as paima `issues[0].message` ir verčia
 * į vartotojo kalbą. Tai išlaiko esamus per-lauko klaidos pranešimus
 * be string duplikavimo.
 */

const ALLOWED_BUSINESS_TYPES = [
  'hairdresser',
  'colorist',
  'salon_owner',
  'salon',
  'student',
  'other',
] as const

const ALLOWED_LANGS = ['lt', 'en', 'ru'] as const

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: 'loginMissing' }),
  password: z.string().min(1, { message: 'loginMissing' }),
  lang: z.enum(ALLOWED_LANGS).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: 'emailInvalid' })
    .email({ message: 'emailInvalid' }),
  password: z.string().min(6, { message: 'passwordTooShort' }),
  first_name: z.string().trim().min(1, { message: 'firstNameRequired' }),
  last_name: z.string().trim().min(1, { message: 'lastNameRequired' }),
  phone: z.string().trim().default(''),
  city: z.string().trim().default(''),
  business_type: z.enum(ALLOWED_BUSINESS_TYPES, {
    message: 'businessTypeRequired',
  }),
  salon_name: z.string().trim().default(''),
  company_code: z.string().trim().default(''),
  daily_dyes_count: z.string().trim().default(''),
  verification_notes: z.string().trim().default(''),
  lang: z.enum(ALLOWED_LANGS).default('lt'),
  confirm_professional: z.literal('on', {
    message: 'confirmProfessionalRequired',
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Vartotojo paskyros redagavimas — laukai, kuriuos klientas pats gali
 * keisti per /paskyra. NEįeina: email (Auth), business_type, verification
 * statusas/dokumentai (admin'o sritis).
 */
export const updateProfileSchema = z.object({
  first_name: z.string().trim().min(1, { message: 'firstNameRequired' }).max(100),
  last_name: z.string().trim().min(1, { message: 'lastNameRequired' }).max(100),
  phone: z.string().trim().max(50).default(''),
  city: z.string().trim().max(100).default(''),
  salon_name: z.string().trim().max(200).default(''),
  company_code: z.string().trim().max(50).default(''),
  daily_dyes_count: z.string().trim().max(50).default(''),
  lang: z.enum(ALLOWED_LANGS).default('lt'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Suvienodintas FormData → object pavertimas. Naudoja `Object.fromEntries`,
 * tačiau pateikia tipą Zod schemoms aiškiai.
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries())
}

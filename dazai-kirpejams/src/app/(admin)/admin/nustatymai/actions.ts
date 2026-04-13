'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Server Action'ai „Nustatymai" puslapiui.
 *
 * Dvi sritys:
 *   1) Įmonės rekvizitai + banko duomenys — rašom į `shop_settings` KV,
 *      kad email šablonai ir užsakymo patvirtinimas naudotų šiuos duomenis
 *      vietoj hardcoded stringų.
 *   2) Administratoriai — CRUD ant `admin_users` lentelės. Reikalauja
 *      service role kliento, nes RLS leidžia skaityti tik savo eilutę.
 */

// ============================================
// Įmonės rekvizitai + banko duomenys
// ============================================

export type UpdateCompanyInfoState = {
  error?: string
  success?: boolean
}

/**
 * Paprastas IBAN formato patikrinimas — LT{2 digits}{16 digits} arba tarpai
 * tarp jų. Nepilna IBAN validacija (checksum), bet pakanka, kad atfiltruotų
 * akivaizdžias klaidas.
 */
function normalizeIban(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, '').toUpperCase()
  if (!cleaned) return ''
  // Priimam tarptautinius IBAN'us, ne tik LT
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(cleaned)) return null
  // Reformatuojam į 4-simbolių grupes, kad UI ir email'uose atrodytų tvarkingai
  return cleaned.replace(/(.{4})/g, '$1 ').trim()
}

export async function updateCompanyInfoAction(
  _prev: UpdateCompanyInfoState,
  formData: FormData
): Promise<UpdateCompanyInfoState> {
  await requireAdmin()
  const supabase = createServerClient()

  const fields = {
    company_legal_name: ((formData.get('legal_name') as string) ?? '').trim(),
    company_reg_code: ((formData.get('reg_code') as string) ?? '').trim(),
    company_vat_code: ((formData.get('vat_code') as string) ?? '').trim(),
    company_address: ((formData.get('address') as string) ?? '').trim(),
    company_email: ((formData.get('email') as string) ?? '').trim(),
    company_phone: ((formData.get('phone') as string) ?? '').trim(),
    bank_recipient: ((formData.get('bank_recipient') as string) ?? '').trim(),
    bank_iban: ((formData.get('bank_iban') as string) ?? '').trim(),
    bank_name: ((formData.get('bank_name') as string) ?? '').trim(),
  }

  // Validacijos — tik tai, kas realiai blokas. Tušti laukai leidžiami
  // (galbūt admin'as pildo palaipsniui), bet jei užpildytas — turi būti OK.
  if (fields.company_email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.company_email)) {
      return { error: 'Neteisingas įmonės el. pašto formatas.' }
    }
  }

  let normalizedIban = fields.bank_iban
  if (fields.bank_iban) {
    const result = normalizeIban(fields.bank_iban)
    if (result === null) {
      return {
        error:
          'Neteisingas IBAN formatas. Naudokite formatą: LT00 0000 0000 0000 0000.',
      }
    }
    normalizedIban = result
  }

  // jsonb value — tekstiniai laukai saugomi kaip JSON string'ai.
  // Supabase automatiškai JSON.stringify'ina per .upsert kai duodam string'ą,
  // nes kolona yra jsonb tipo — ji priima bet kokį JSON primityvą.
  const rows = [
    { key: 'company_legal_name', value: fields.company_legal_name },
    { key: 'company_reg_code', value: fields.company_reg_code },
    { key: 'company_vat_code', value: fields.company_vat_code },
    { key: 'company_address', value: fields.company_address },
    { key: 'company_email', value: fields.company_email },
    { key: 'company_phone', value: fields.company_phone },
    { key: 'bank_recipient', value: fields.bank_recipient },
    { key: 'bank_iban', value: normalizedIban },
    { key: 'bank_name', value: fields.bank_name },
  ].map((r) => ({
    key: r.key,
    value: r.value, // jsonb stulpelis priima string'us kaip JSON skalar'us
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('shop_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) {
    console.error('[admin/nustatymai/actions] updateCompanyInfo:', error.message)
    return { error: `Nepavyko išsaugoti: ${error.message}` }
  }

  revalidatePath('/admin/nustatymai')
  // Email šablonai ir order confirmation puslapis skaito šiuos duomenis —
  // invalidate'inam jų cache'us taip pat.
  revalidatePath('/', 'layout')
  return { success: true }
}

// ============================================
// Administratoriai
// ============================================

export type AddAdminState = {
  error?: string
  success?: boolean
}

/**
 * Pridedam admin'ą pagal el. paštą. User'is JAU turi egzistuoti `auth.users` —
 * mes tik pridedam eilutę į `admin_users`. Jei user'io dar nėra, grąžinam
 * klaidą su instrukcija („paprašykite vartotojo prisiregistruoti").
 *
 * Naudojam service role klientą, nes:
 *   - RLS ant admin_users leidžia skaityti tik savo eilutę
 *   - reikia priėjimo prie auth.users (arba auth.admin API) ieškant user ID
 */
export async function addAdminAction(
  _prev: AddAdminState,
  formData: FormData
): Promise<AddAdminState> {
  await requireAdmin()

  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  if (!email) {
    return { error: 'Įveskite el. paštą.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Neteisingas el. pašto formatas.' }
  }

  const supabase = createServerClient()

  // Randam user ID per auth.admin.listUsers() — paginated, bet mums reikia
  // tik vienos paieškos. getUserByEmail nėra prieinama Supabase JS SDK v2,
  // todėl naudojam listUsers su filtravimu client-side.
  //
  // Pagal Supabase dokumentaciją, listUsers grąžina iki 1000 eilučių per page.
  // Jei admin'ų verslas yra <1000 vartotojų, vieno page'o užtenka.
  const { data: listResult, error: listError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (listError) {
    console.error('[admin/nustatymai/actions] listUsers:', listError.message)
    return {
      error: 'Nepavyko patikrinti vartotojų sąrašo. Bandykite dar kartą.',
    }
  }

  const matchedUser = listResult.users.find(
    (u) => u.email?.toLowerCase() === email
  )

  if (!matchedUser) {
    return {
      error:
        'Toks vartotojas dar neprisiregistravo. Paprašykite jo prisiregistruoti sistemoje, tada pridėkite iš naujo.',
    }
  }

  // Tikrinam, ar jau nėra admin'as — friendly žinutė
  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', matchedUser.id)
    .maybeSingle()

  if (existing) {
    return { error: 'Šis vartotojas jau yra administratorius.' }
  }

  const { error: insertError } = await supabase.from('admin_users').insert({
    id: matchedUser.id,
    email: matchedUser.email ?? email,
  })

  if (insertError) {
    console.error(
      '[admin/nustatymai/actions] insert admin:',
      insertError.message
    )
    return { error: `Nepavyko pridėti: ${insertError.message}` }
  }

  revalidatePath('/admin/nustatymai')
  return { success: true }
}

/**
 * Pašalinam admin'ą. Saugiklis: negalima pašalinti savęs — kitaip galima
 * lengvai pasidaryti „lockout". Negalima pašalinti paskutinio admin'o —
 * kitaip parduotuvė lieka be prieigos.
 */
export async function removeAdminAction(formData: FormData): Promise<void> {
  const currentAdmin = await requireAdmin()

  const targetId = ((formData.get('id') as string) ?? '').trim()
  if (!targetId) {
    redirect('/admin/nustatymai?error=invalid-id')
  }

  if (targetId === currentAdmin.id) {
    redirect('/admin/nustatymai?error=self-remove')
  }

  const supabase = createServerClient()

  // Tikrinam, kad nebūtų paskutinis admin'as
  const { count } = await supabase
    .from('admin_users')
    .select('id', { count: 'exact', head: true })

  if ((count ?? 0) <= 1) {
    redirect('/admin/nustatymai?error=last-admin')
  }

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', targetId)

  if (error) {
    console.error('[admin/nustatymai/actions] removeAdmin:', error.message)
    redirect('/admin/nustatymai?error=delete-failed')
  }

  revalidatePath('/admin/nustatymai')
}

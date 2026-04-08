import 'server-only'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import type { User } from '@supabase/supabase-js'

/**
 * Admin'o allow-list iš env var `ADMIN_EMAILS` (kableliais atskirti email'ai).
 * Jei env tuščia — niekas nėra admin (saugesnis default nei atvirkščiai).
 *
 * Pavyzdys: ADMIN_EMAILS=info@dazaikirpejams.lt,labora@dazaikirpejams.lt
 */
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().has(email.toLowerCase())
}

/**
 * Grąžina prisijungusį admin'o `User` arba redirect'ina į /admin/login.
 *
 * Patikrinimai:
 *  1. Yra galiojanti Supabase Auth sesija (getUser() per JWT validaciją)
 *  2. Vartotojo email yra `ADMIN_EMAILS` allow-list'e
 *
 * Naudoti KIEKVIENAME admin puslapyje ir Server Action'e — proxy tikrinimas
 * yra tik optimistinis (kad išvengtume nereikalingo RSC renderinimo).
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  if (!isAdminEmail(user.email)) {
    // Prisijungęs, bet ne admin — iš karto atsijungiam ir atgal į login
    await supabase.auth.signOut()
    redirect('/admin/login?error=forbidden')
  }

  return user
}

/** Kaip requireAdmin, bet grąžina null vietoj redirect'o — naudinga layout'ams */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

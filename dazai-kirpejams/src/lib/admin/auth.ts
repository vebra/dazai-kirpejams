import 'server-only'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Admin'ų allow-list'as laikomas DB `admin_users` lentelėje, o prieigą
 * užtikrina Postgres RLS politikos + `is_admin()` function'as (žr.
 * supabase/migrations/004_admin_access.sql).
 *
 * App lygmenyje čia dubliuojame patikrą dėl dviejų priežasčių:
 *  1. Norim anksti atlikti redirect į /admin/login (nelaukiam RLS `permission
 *     denied` iš kiekvienos užklausos).
 *  2. getAdminUser() naudoja layout'as sprendžiant ar rodyti sidebar'ą.
 */

/**
 * Patikrina ar dabartinio Supabase client'o vartotojas yra admin_users lentelėje.
 * RLS politika "Users can read own admin row" leidžia autentifikuotam vartotojui
 * matyti SAVO eilutę — todėl užklausa grąžina vieną arba nulį eilučių.
 */
async function isCurrentUserAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    // PostgREST grąžina klaidą jei RLS blokuoja SELECT'ą arba lentelė neegzistuoja.
    // Abiem atvejais saugiausia laikyti, kad vartotojas NĖRA admin.
    console.error('[admin/auth] admin_users lookup error:', error.message)
    return false
  }
  return data !== null
}

/**
 * Grąžina prisijungusį admin'o `User` arba redirect'ina į /admin/login.
 *
 * Naudoti KIEKVIENAME protected admin puslapyje ir Server Action'e — proxy
 * tikrinimas yra tik optimistinis (tik session cookie egzistavimas).
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const isAdmin = await isCurrentUserAdmin(supabase, user.id)
  if (!isAdmin) {
    // Prisijungęs, bet ne admin — iš karto atsijungiam ir atgal į login
    await supabase.auth.signOut()
    redirect('/admin/login?error=forbidden')
  }

  return user
}

/** Kaip requireAdmin, bet grąžina null vietoj redirect'o — naudinga layout'ams. */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const isAdmin = await isCurrentUserAdmin(supabase, user.id)
  if (!isAdmin) return null

  return user
}

/**
 * Po `signInWithPassword` patikrina, ar vartotojas yra admin. Jei ne —
 * atsijungia ir grąžina false. Naudojama login Server Action'e.
 */
export async function verifyAdminAfterLogin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const isAdmin = await isCurrentUserAdmin(supabase, userId)
  if (!isAdmin) {
    await supabase.auth.signOut()
  }
  return isAdmin
}

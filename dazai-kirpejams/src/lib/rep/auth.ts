import 'server-only'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Vadybininkės (sales_rep) prieigos kontrolė. Įleidžiami:
 *  - user_profiles.role = 'sales_rep'
 *  - ARBA admin (admin_users) — admin gali naudoti rep srautą (kaip RPC leidžia)
 *
 * Kaip ir /admin — proxy daro optimistinį sesijos patikrinimą, o realų role
 * patikrinimą daro šios funkcijos kiekviename rep puslapyje / action'e.
 */
async function resolveAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<{ isRep: boolean; isAdmin: boolean }> {
  const [{ data: prof }, { data: adminRow }] = await Promise.all([
    supabase.from('user_profiles').select('role').eq('id', userId).maybeSingle(),
    supabase.from('admin_users').select('id').eq('id', userId).maybeSingle(),
  ])
  return { isRep: prof?.role === 'sales_rep', isAdmin: adminRow !== null }
}

export type RepUser = { user: User; isRep: boolean; isAdmin: boolean }

/** Grąžina prisijungusį rep/admin arba redirect'ina į /vadybininke/login. */
export async function requireSalesRep(): Promise<RepUser> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/vadybininke/login')

  const { isRep, isAdmin } = await resolveAccess(supabase, user.id)
  if (!isRep && !isAdmin) {
    await supabase.auth.signOut()
    redirect('/vadybininke/login?error=forbidden')
  }
  return { user, isRep, isAdmin }
}

/** Kaip requireSalesRep, bet grąžina null vietoj redirect'o (layout'ui). */
export async function getRepUser(): Promise<RepUser | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { isRep, isAdmin } = await resolveAccess(supabase, user.id)
  if (!isRep && !isAdmin) return null
  return { user, isRep, isAdmin }
}

/** Po signIn patikrina prieigą; jei ne rep/admin — atsijungia. */
export async function verifyRepAfterLogin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { isRep, isAdmin } = await resolveAccess(supabase, userId)
  if (!isRep && !isAdmin) {
    await supabase.auth.signOut()
    return false
  }
  return true
}

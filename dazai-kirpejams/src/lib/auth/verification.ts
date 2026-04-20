import { createServerSupabase } from '@/lib/supabase/ssr'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | null

export type VerificationResult = {
  status: VerificationStatus
  isLoggedIn: boolean
  /** True jei užklausa sulūžo (ne user/profile nebuvimas) — UI gali parodyti recovery action. */
  hadError: boolean
}

/**
 * Server-side: paima dabartinio vartotojo verifikacijos statusą.
 * Naudoti SSR layout'e, kad initialStatus būtų perduotas į VerificationProvider —
 * taip išvengiame initial flash'o ir client RPC dependency.
 *
 * Klaidos atveju (RPC sulūžo, tinklas, Supabase down) grąžina hadError=true,
 * kad UI galėtų rodyti recovery action vietoj generic "Prisijunkite".
 */
export async function getVerificationDetails(): Promise<VerificationResult> {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) {
      console.warn('[verification] auth.getUser failed:', userErr.message)
      return { status: null, isLoggedIn: false, hadError: true }
    }

    if (!user) {
      return { status: null, isLoggedIn: false, hadError: false }
    }

    const { data, error } = await supabase.rpc('get_my_verification_status')

    if (error) {
      console.warn(
        `[verification] RPC failed for user ${user.id}:`,
        error.message
      )
      return { status: null, isLoggedIn: true, hadError: true }
    }

    if (typeof data === 'string') {
      return {
        status: data as Exclude<VerificationStatus, null>,
        isLoggedIn: true,
        hadError: false,
      }
    }

    // RPC pavyko, bet user_profiles row neegzistuoja (data=null).
    // Migration 018 turėtų to nebeleisti naujiems registrantams,
    // tačiau backfill padengia esamus — žr. 018_user_profiles_auto_create.sql.
    console.warn(
      `[verification] No user_profile row for ${user.id} — should be auto-created by trigger`
    )
    return { status: null, isLoggedIn: true, hadError: false }
  } catch (err) {
    console.warn(
      '[verification] unexpected exception:',
      err instanceof Error ? err.message : err
    )
    return { status: null, isLoggedIn: false, hadError: true }
  }
}

/**
 * Backwards-compatible wrapper'is — naudojamas /paskyra ir /apmokejimas puslapiuose,
 * kuriuose svarbus tik statusas.
 */
export async function getVerificationStatus(): Promise<VerificationStatus> {
  return (await getVerificationDetails()).status
}

/** Convenience: ar dabartinis vartotojas yra patvirtintas profesionalas? */
export async function isUserVerified(): Promise<boolean> {
  return (await getVerificationStatus()) === 'approved'
}

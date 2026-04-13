import { createServerSupabase } from '@/lib/supabase/ssr'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | null

/**
 * Server-side: check current user's verification status.
 * Returns 'approved' | 'pending' | 'rejected' | null (not logged in).
 * Safe to call from RSC / Server Actions — uses cookie-based session.
 */
export async function getVerificationStatus(): Promise<VerificationStatus> {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase.rpc('get_my_verification_status')
    if (data && typeof data === 'string') {
      return data as VerificationStatus
    }
    return null
  } catch {
    return null
  }
}

/** Convenience: is the current user a verified professional? */
export async function isUserVerified(): Promise<boolean> {
  return (await getVerificationStatus()) === 'approved'
}

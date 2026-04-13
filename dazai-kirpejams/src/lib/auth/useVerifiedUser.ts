'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import type { User } from '@supabase/supabase-js'

type VerifiedUserState = {
  isLoading: boolean
  user: User | null
  status: 'pending' | 'approved' | 'rejected' | null
  isVerified: boolean
}

/**
 * Client-side hook: returns current auth user + verification status.
 * Calls `get_my_verification_status()` RPC (SECURITY DEFINER).
 */
export function useVerifiedUser(): VerifiedUserState {
  const [state, setState] = useState<VerifiedUserState>({
    isLoading: true,
    user: null,
    status: null,
    isVerified: false,
  })

  useEffect(() => {
    const supabase = createBrowserSupabase()

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setState({ isLoading: false, user: null, status: null, isVerified: false })
        return
      }

      const { data } = await supabase.rpc('get_my_verification_status')
      const status =
        data && typeof data === 'string'
          ? (data as 'pending' | 'approved' | 'rejected')
          : null

      setState({
        isLoading: false,
        user,
        status,
        isVerified: status === 'approved',
      })
    }

    check()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      check()
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

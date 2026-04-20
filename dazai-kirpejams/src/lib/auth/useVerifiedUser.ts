'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import type { User } from '@supabase/supabase-js'
import type { VerificationStatus } from '@/lib/auth/verification'

type VerifiedUserState = {
  isLoading: boolean
  user: User | null
  status: VerificationStatus
  isVerified: boolean
}

type UseVerifiedUserOptions = {
  initialStatus?: VerificationStatus
  initialIsLoggedIn?: boolean
}

async function fetchVerificationWithRetry(
  supabase: ReturnType<typeof createBrowserSupabase>,
  signal: AbortSignal
): Promise<VerificationStatus> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal.aborted) return null
    const { data, error } = await supabase.rpc('get_my_verification_status')
    if (signal.aborted) return null

    if (!error && typeof data === 'string') {
      return data as Exclude<VerificationStatus, null>
    }

    if (error) {
      console.warn(
        `[verification] client RPC attempt ${attempt + 1} failed:`,
        error.message
      )
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500))
      }
    } else {
      // data === null — profile row missing, retry won't help
      return null
    }
  }
  return null
}

export function useVerifiedUser(
  options: UseVerifiedUserOptions = {}
): VerifiedUserState {
  const { initialStatus = null, initialIsLoggedIn = false } = options

  const [state, setState] = useState<VerifiedUserState>({
    isLoading: !initialIsLoggedIn ? false : initialStatus === null,
    user: null,
    status: initialStatus,
    isVerified: initialStatus === 'approved',
  })

  useEffect(() => {
    const supabase = createBrowserSupabase()
    const controller = new AbortController()

    async function check() {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (controller.signal.aborted) return

      if (userErr || !user) {
        setState({
          isLoading: false,
          user: null,
          status: null,
          isVerified: false,
        })
        return
      }

      const status = await fetchVerificationWithRetry(supabase, controller.signal)
      if (controller.signal.aborted) return

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

    return () => {
      controller.abort()
      subscription.unsubscribe()
    }
  }, [])

  return state
}

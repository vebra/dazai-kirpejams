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

    // Anti-flash: site layout'as statinis (be cookies — tyčia), tad
    // initialIsLoggedIn niekada nepaduodamas ir isLoading startuoja false —
    // prisijungęs pro pirmo užkrovimo metu matydavo svečio „prisijunkite"
    // bloką, kol baigsis getSession + verifikacijos RPC. Supabase SSR sesija
    // gyvena `sb-*-auth-token*` cookie — jį matome sinchroniškai iškart po
    // hydration: jei sesijos cookie yra, rodome skeleton'ą (isLoading=true),
    // o ne svečio UI. Svečiams (be cookie) niekas nesikeičia.
    if (
      /(?:^|;\s*)sb-[^=;]*-auth-token[^=;]*=/.test(document.cookie)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tyčinis anti-flash pattern'as (žr. komentarą aukščiau): sesijos cookie tikrinamas tik kliente po hydration, todėl isLoading nustatomas efekte
      setState((s) =>
        s.isLoading || s.user ? s : { ...s, isLoading: true }
      )
    }

    async function check() {
      // getSession() skaito sesiją LOKALIAI (iš slapukų), be tinklo užklausos —
      // patikima net silpnu mobiliu ryšiu / in-app naršyklėje. getUser() darydavo
      // tinklo validaciją, kuri mobiliajame neretai neįvyksta → kainos nedingdavo.
      // Kainų rodymas nėra saugumo riba (užsakymas perskaičiuojamas serveryje).
      const {
        data: { session },
        error: userErr,
      } = await supabase.auth.getSession()
      const user = session?.user ?? null

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

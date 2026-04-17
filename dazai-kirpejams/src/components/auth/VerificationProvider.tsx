'use client'

import { createContext, useContext } from 'react'
import { useVerifiedUser } from '@/lib/auth/useVerifiedUser'

const VerificationContext = createContext<boolean>(false)

export function VerificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isVerified } = useVerifiedUser()
  return (
    <VerificationContext.Provider value={isVerified}>
      {children}
    </VerificationContext.Provider>
  )
}

/**
 * Kliento pusės hook'as — grąžina `true` jei vartotojas yra patvirtintas
 * profesionalas. Naudojamas ProductCard ir kituose komponentuose, kur
 * reikia žinoti ar rodyti kainas.
 */
export function useIsVerified(): boolean {
  return useContext(VerificationContext)
}

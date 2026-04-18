'use client'

import { createContext, useContext } from 'react'
import { useVerifiedUser } from '@/lib/auth/useVerifiedUser'
import type { VerificationStatus } from '@/lib/auth/verification'

type VerificationContextValue = {
  isVerified: boolean
  isLoggedIn: boolean
  isLoading: boolean
  status: VerificationStatus
}

const VerificationContext = createContext<VerificationContextValue>({
  isVerified: false,
  isLoggedIn: false,
  isLoading: true,
  status: null,
})

export function VerificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isVerified, user, status, isLoading } = useVerifiedUser()
  return (
    <VerificationContext.Provider
      value={{
        isVerified,
        isLoggedIn: !!user,
        isLoading,
        status,
      }}
    >
      {children}
    </VerificationContext.Provider>
  )
}

/**
 * Kliento pusės hook'as — grąžina `true` jei vartotojas yra patvirtintas
 * profesionalas (status === 'approved').
 */
export function useIsVerified(): boolean {
  return useContext(VerificationContext).isVerified
}

/**
 * Praplėstas hook'as — grąžina pilną verifikacijos būseną.
 * Naudoti, kai reikia atskirti: neprisijungęs / prisijungęs-laukia / atmestas / patvirtintas.
 */
export function useVerification(): VerificationContextValue {
  return useContext(VerificationContext)
}

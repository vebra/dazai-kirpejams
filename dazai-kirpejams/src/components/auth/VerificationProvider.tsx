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

type VerificationProviderProps = {
  children: React.ReactNode
  initialStatus?: VerificationStatus
  initialIsLoggedIn?: boolean
}

export function VerificationProvider({
  children,
  initialStatus = null,
  initialIsLoggedIn = false,
}: VerificationProviderProps) {
  const { isVerified, user, status, isLoading } = useVerifiedUser({
    initialStatus,
    initialIsLoggedIn,
  })
  return (
    <VerificationContext.Provider
      value={{
        isVerified,
        isLoggedIn: !!user || (isLoading && initialIsLoggedIn),
        isLoading,
        status,
      }}
    >
      {children}
    </VerificationContext.Provider>
  )
}

export function useIsVerified(): boolean {
  return useContext(VerificationContext).isVerified
}

export function useVerification(): VerificationContextValue {
  return useContext(VerificationContext)
}

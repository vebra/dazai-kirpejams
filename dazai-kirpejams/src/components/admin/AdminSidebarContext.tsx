'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type AdminSidebarContextType = {
  open: boolean
  toggle: () => void
  close: () => void
}

const Ctx = createContext<AdminSidebarContextType>({
  open: false,
  toggle: () => {},
  close: () => {},
})

export function AdminSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close = useCallback(() => setOpen(false), [])

  return (
    <Ctx.Provider value={{ open, toggle, close }}>{children}</Ctx.Provider>
  )
}

export function useAdminSidebar() {
  return useContext(Ctx)
}

'use client'

import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Būsenos keitimo „select" su auto-submit (onChange → form.requestSubmit) ir
 * aiškiu gyvybės ženklu: keitimo metu pasirodo sukutis šalia, o pats select'as
 * užblokuojamas (cursor-wait), kad nebūtų dvigubų pateikimų. useFormStatus —
 * privalo būti <form> viduje.
 */
export function PendingSelect({
  name,
  defaultValue,
  className,
  children,
  ariaLabel,
}: {
  name: string
  defaultValue: string
  className: string
  children: ReactNode
  ariaLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={pending}
        aria-label={ariaLabel}
        onChange={(e) => {
          const form = e.target.closest('form')
          if (form) form.requestSubmit()
        }}
        className={`${className} ${pending ? 'opacity-60 cursor-wait' : ''}`}
      >
        {children}
      </select>
      {pending && (
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-brand-magenta border-t-transparent animate-spin shrink-0"
          aria-hidden
        />
      )}
    </span>
  )
}

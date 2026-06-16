'use client'

import { useFormStatus } from 'react-dom'

/**
 * Universalus „submit" mygtukas su aiškia paspaudimo būsena: paspaudus matosi
 * paspaudimas (active:scale), atsiranda sukutis su laukimo tekstu, mygtukas
 * užblokuojamas (apsauga nuo dvigubo paspaudimo). useFormStatus — privalo būti
 * <form> viduje.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  spinnerClassName = 'border-current border-t-transparent',
}: {
  children: React.ReactNode
  pendingLabel: string
  className: string
  spinnerClassName?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-wait transition-all ${className}`}
    >
      {pending ? (
        <>
          <span
            className={`w-4 h-4 rounded-full border-2 animate-spin ${spinnerClassName}`}
            aria-hidden
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}

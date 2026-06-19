'use client'

import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Universalus „submit" mygtukas su aiškia laukimo būsena: paspaudus matosi
 * paspaudimas (active:scale), atsiranda sukutis (+ nebūtinas laukimo tekstas),
 * mygtukas užblokuojamas — apsauga nuo dvigubo paspaudimo. useFormStatus —
 * privalo būti <form> viduje. Sukučio spalva paveldima iš teksto (border-current),
 * todėl tinka tiek šviesiems, tiek spalvotiems mygtukams.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  spinnerClassName = 'border-current border-t-transparent',
  spinnerSize = 'w-4 h-4',
  onClick,
  title,
}: {
  children: ReactNode
  /** Tekstas šalia sukučio laukimo metu. Praleidus — rodomas tik sukutis. */
  pendingLabel?: string
  className: string
  spinnerClassName?: string
  spinnerSize?: string
  /** Pvz. window.confirm tikrinimui (e.preventDefault() atšaukia). */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  title?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-wait transition-all ${className}`}
    >
      {pending ? (
        <>
          <span
            className={`${spinnerSize} rounded-full border-2 animate-spin ${spinnerClassName}`}
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

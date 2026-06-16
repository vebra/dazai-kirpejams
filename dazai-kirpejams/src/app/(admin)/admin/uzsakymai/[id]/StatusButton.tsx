'use client'

import { useFormStatus } from 'react-dom'

/**
 * Būsenos keitimo mygtukas su aiškia paspaudimo būsena: paspaudus iškart
 * matosi paspaudimas (active:scale), atsiranda sukutis su „Keičiama…", o visi
 * mygtukai užblokuojami, kad nebūtų dvigubų paspaudimų. useFormStatus —
 * privalo būti <form> viduje.
 */
export function StatusButton({
  label,
  colorClassName,
}: {
  label: string
  colorClassName: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-wait transition-all ${colorClassName}`}
    >
      {pending ? (
        <>
          <span
            className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden
          />
          Keičiama…
        </>
      ) : (
        `→ ${label}`
      )}
    </button>
  )
}

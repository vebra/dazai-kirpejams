'use client'

import { useFormStatus } from 'react-dom'

/**
 * „Pergeneruoti sąskaitą" mygtukas su būsena: paspaudus iškart matosi
 * paspaudimas (active:scale) ir „Generuojama…" su sukučiu, kol vyksta
 * serverio veiksmas (useFormStatus — turi būti <form> viduje).
 */
export function RegenerateButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      title="Atnaujinti PDF pagal dabartinį užsakymą (po pridėtų prekių ar pataisytų kainų)"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5F5F7] border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-white active:scale-95 disabled:opacity-70 transition-all"
    >
      {pending ? (
        <>
          <span
            className="w-4 h-4 rounded-full border-2 border-brand-gray-400 border-t-transparent animate-spin"
            aria-hidden
          />
          Generuojama…
        </>
      ) : (
        '↻ Pergeneruoti'
      )}
    </button>
  )
}

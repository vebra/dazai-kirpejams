'use client'

/** Spausdinimo mygtukas server-komponentams (window.print reikia kliento). */
export function PrintButton({
  className,
  label = '🖨 Spausdinti',
}: {
  className?: string
  label?: string
}) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  )
}

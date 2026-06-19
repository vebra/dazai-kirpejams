'use client'

/** Spausdinimo mygtukas server-komponentams (window.print reikia kliento). */
export function PrintButton({
  className,
  label = '🖨 Spausdinti',
  onBeforePrint,
}: {
  className?: string
  label?: string
  /** Jei perduota — paleidžiama (ir palaukiama) prieš spausdinant (pvz. išsaugoti). */
  onBeforePrint?: () => void | Promise<void>
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (onBeforePrint) {
          try {
            await onBeforePrint()
          } catch {
            /* išsaugojimo klaida nepertraukia spausdinimo */
          }
        }
        window.print()
      }}
      className={className}
    >
      {label}
    </button>
  )
}

'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-sm font-semibold transition-colors"
    >
      🖨 Spausdinti
    </button>
  )
}

'use client'

/**
 * Užsakymo ištrynimo mygtukas su browser'io patvirtinimu — kad admin'as
 * netyčia neištrintų klikundamas. Įveda užsakymo numerį tekstu, kad
 * būtų aiškiai tyčinis veiksmas.
 */
export function DeleteOrderButton({
  action,
  orderId,
  orderNumber,
}: {
  action: (formData: FormData) => Promise<void>
  orderId: string
  orderNumber: string
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `Tikrai ištrinti užsakymą ${orderNumber}?\n\n` +
        `Šis veiksmas neatšaukiamas. Prekės bus grąžintos į sandėlį.`
    )
    if (!confirmed) {
      e.preventDefault()
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={orderId} />
      <button
        type="submit"
        className="px-4 py-2.5 bg-white border-2 border-red-300 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-50 hover:border-red-400 transition-colors"
      >
        Ištrinti užsakymą {orderNumber}
      </button>
    </form>
  )
}

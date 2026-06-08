'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelMyPendingOrder } from '../../actions'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!window.confirm('Atšaukti šį užsakymą? Veiksmo atšaukti nebegalėsite.')) return
    setError(null)
    startTransition(async () => {
      const res = await cancelMyPendingOrder(orderId)
      if (res.ok) {
        router.push('/vadybininke/uzsakymai')
        router.refresh()
      } else {
        setError(res.error ?? 'Nepavyko atšaukti.')
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="px-4 py-2 bg-white border border-[#ddd] text-red-700 rounded-lg font-semibold text-sm hover:bg-red-50 hover:border-red-300 active:scale-95 disabled:opacity-60 transition-all"
      >
        {pending ? 'Atšaukiama…' : 'Atšaukti užsakymą'}
      </button>
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
    </div>
  )
}

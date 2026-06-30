'use client'

type Item = {
  name: string
  sku: string | null
  quantity: number
  unitPriceCents: number
  totalCents: number
}

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const DATE = new Intl.DateTimeFormat('lt-LT', { dateStyle: 'short' })

export function DeliveryNote({
  orderNumber,
  createdAt,
  clientName,
  items,
  subtotalCents,
  deliveryCostCents,
  vatCents,
  totalCents,
}: {
  orderNumber: string
  createdAt: string
  clientName: string
  items: Item[]
  subtotalCents: number
  deliveryCostCents: number
  vatCents: number
  totalCents: number
}) {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        className="print:hidden px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors"
      >
        🖨 Spausdinti važtaraštį
      </button>

      {/* Spausdinant rodom TIK važtaraštį. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print { @page { margin: 1.4cm; size: A4; } }`,
        }}
      />

      <div className="hidden print:block">
        <header className="border-b border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold">Važtaraštis</h1>
          <div className="mt-3 flex items-center justify-between text-sm flex-wrap gap-2">
            <div>
              Užsakymas: <strong className="font-mono">{orderNumber}</strong>
            </div>
            <div>Data: {DATE.format(new Date(createdAt))}</div>
          </div>
          <div className="mt-1 text-sm">
            Klientas: <strong>{clientName}</strong>
          </div>
        </header>

        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2 pr-2 w-[28px]">#</th>
              <th className="py-2 pr-2">Prekė</th>
              <th className="py-2 pr-2 text-right w-[70px]">Kiekis</th>
              <th className="py-2 pr-2 text-right w-[90px]">Vnt. kaina</th>
              <th className="py-2 pr-2 text-right w-[100px]">Suma</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="py-1.5 pr-2 tabular-nums">{idx + 1}</td>
                <td className="py-1.5 pr-2">
                  {it.name}
                  {it.sku ? (
                    <span className="text-gray-500 font-mono text-[11px]"> · {it.sku}</span>
                  ) : null}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums font-semibold">
                  {it.quantity}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">
                  {PRICE.format(it.unitPriceCents / 100)}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">
                  {PRICE.format(it.totalCents / 100)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-black">
              <td className="py-2 pr-2 font-semibold" colSpan={2}>
                Iš viso, vnt.
              </td>
              <td className="py-2 pr-2 text-right tabular-nums font-semibold">{totalQty}</td>
              <td className="py-2 pr-2 text-right text-gray-600">Tarpinė suma</td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {PRICE.format(subtotalCents / 100)}
              </td>
            </tr>
            {deliveryCostCents > 0 && (
              <tr>
                <td colSpan={3} />
                <td className="py-1 pr-2 text-right text-gray-600">Pristatymas</td>
                <td className="py-1 pr-2 text-right tabular-nums">
                  {PRICE.format(deliveryCostCents / 100)}
                </td>
              </tr>
            )}
            {vatCents > 0 && (
              <tr>
                <td colSpan={3} />
                <td className="py-1 pr-2 text-right text-gray-600">PVM</td>
                <td className="py-1 pr-2 text-right tabular-nums">
                  {PRICE.format(vatCents / 100)}
                </td>
              </tr>
            )}
            <tr className="font-bold">
              <td colSpan={3} />
              <td className="py-2 pr-2 text-right">Iš viso</td>
              <td className="py-2 pr-2 text-right tabular-nums border-t border-black">
                {PRICE.format(totalCents / 100)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-12 grid grid-cols-2 gap-8 text-[12px]">
          <div className="border-t border-gray-400 pt-1.5">Perdavė (parašas)</div>
          <div className="border-t border-gray-400 pt-1.5">Priėmė (parašas)</div>
        </div>

        <footer className="mt-8 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
          Color SHOCK · Dažai Kirpėjams
        </footer>
      </div>
    </>
  )
}

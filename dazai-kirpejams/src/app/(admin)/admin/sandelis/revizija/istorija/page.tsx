import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { getStockMovements } from '@/lib/admin/queries'
import { getWarehouseOverview } from '@/lib/admin/warehouse-overview'
import { PrintButton } from '@/components/admin/PrintButton'

export const metadata = { title: 'Sandėlio apžvalga ir istorija' }
export const dynamic = 'force-dynamic'

type DetailItem = {
  productId: string
  name: string
  colorNumber: string | null
  sku: string | null
  system: number
  counted: number
  diff: number
  valueCents: number
}

type RevisionRow = {
  id: string
  created_at: string
  applied_count: number
  total_delta: number
  value_change_cents: number
  details: DetailItem[]
}

const DT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const REASON_LABEL: Record<string, string> = {
  receiving: 'Priėmimas',
  sale: 'Pardavimas (internetas)',
  cancel_restore: 'Grąžinimas',
  correction: 'Korekcija',
  writeoff: 'Nurašymas',
  issue_to_rep: 'Išvežimas vadybininkei',
  return_from_rep: 'Grąžinimas iš vadybininkės',
  rep_sale: 'Pardavimas (vadybininkė)',
  rep_sale_cancel: 'Pardavimo atšaukimas',
  own_use: 'Savo naudojimui',
}

const REASON_CLS: Record<string, string> = {
  receiving: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sale: 'bg-blue-50 text-blue-700 border-blue-200',
  cancel_restore: 'bg-amber-50 text-amber-700 border-amber-200',
  correction: 'bg-gray-100 text-gray-600 border-gray-200',
  writeoff: 'bg-red-50 text-red-700 border-red-200',
  issue_to_rep: 'bg-purple-50 text-purple-700 border-purple-200',
  return_from_rep: 'bg-teal-50 text-teal-700 border-teal-200',
  rep_sale: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rep_sale_cancel: 'bg-orange-50 text-orange-700 border-orange-200',
  own_use: 'bg-pink-50 text-pink-700 border-pink-200',
}

function eur(cents: number, signed = false): string {
  const v = (Math.abs(cents) / 100).toFixed(2).replace('.', ',')
  const sign = signed ? (cents < 0 ? '−' : cents > 0 ? '+' : '') : cents < 0 ? '−' : ''
  return `${sign}${v} €`
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default async function WarehouseOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  await requireAdmin()
  const sp = await searchParams

  // Numatytasis laikotarpis — einamasis mėnuo
  const now = new Date()
  const defFrom = ymd(new Date(now.getFullYear(), now.getMonth(), 1))
  const defTo = ymd(now)
  const from = typeof sp.from === 'string' && sp.from ? sp.from : defFrom
  const to = typeof sp.to === 'string' && sp.to ? sp.to : defTo

  const supabase = createServerClient()
  const [overview, movements, revRes] = await Promise.all([
    getWarehouseOverview({ from, to }),
    getStockMovements({ from, to, limit: 300 }),
    supabase
      .from('stock_revisions')
      .select('id, created_at, applied_count, total_delta, value_change_cents, details')
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59.999`)
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  if (revRes.error) console.error('[revizija/istorija]', revRes.error.message)
  const revisions = (revRes.data ?? []) as RevisionRow[]

  const salesUnits = overview.onlineUnits + overview.repUnits
  const salesValueCents = overview.onlineValueCents + overview.repValueCents
  const revTotalDelta = revisions.reduce((s, r) => s + r.total_delta, 0)
  const revValueCents = revisions.reduce((s, r) => s + r.value_change_cents, 0)

  const PERIOD_PRESETS: Array<{ label: string; from: string; to: string }> = [
    { label: 'Šis mėnuo', from: defFrom, to: defTo },
    {
      label: 'Praėjęs mėnuo',
      from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)),
    },
    {
      label: 'Pask. 7 d.',
      from: ymd(new Date(now.getTime() - 6 * 864e5)),
      to: defTo,
    },
    {
      label: 'Šie metai',
      from: ymd(new Date(now.getFullYear(), 0, 1)),
      to: defTo,
    },
  ]

  return (
    <div className="space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background:white !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
              aside,[data-admin-sidebar],header[data-admin-topbar],.admin-sidebar,.admin-topbar{display:none !important;}
              .print-hide{display:none !important;}
              @page{margin:1cm;size:A4;}
            }
          `,
        }}
      />

      <div className="print-hide flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Sandėlio apžvalga ir istorija
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Pardavimai, priėmimai, nurašymai ir revizijos pasirinktu laikotarpiu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton className="px-4 py-2 bg-white border border-[#ddd] rounded-lg text-[13px] font-semibold text-brand-gray-900 hover:bg-[#F5F5F7]" />
          <Link
            href="/admin/sandelis"
            className="text-[13px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
          >
            ← Sandelis
          </Link>
        </div>
      </div>

      {/* Laikotarpis */}
      <div className="print-hide flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {PERIOD_PRESETS.map((p) => {
            const active = p.from === from && p.to === to
            return (
              <Link
                key={p.label}
                href={`?from=${p.from}&to=${p.to}`}
                className={`px-3 py-2 rounded-lg border text-[13px] font-semibold transition-colors ${
                  active
                    ? 'bg-brand-magenta text-white border-brand-magenta'
                    : 'bg-white text-brand-gray-900 border-[#ddd] hover:border-brand-magenta'
                }`}
              >
                {p.label}
              </Link>
            )
          })}
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2 ml-auto">
          <div>
            <label className="block text-[11px] font-semibold text-brand-gray-500 mb-1">Nuo</label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="px-3 py-2 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-brand-gray-500 mb-1">Iki</label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="px-3 py-2 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-black transition-colors"
          >
            Filtruoti
          </button>
        </form>
      </div>

      <div className="hidden print:block text-sm text-black">
        Laikotarpis: {from} – {to}
      </div>

      {/* ── APŽVALGA ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.5px] text-brand-gray-500">
          Apžvalga
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Parduota"
            value={`${salesUnits} vnt.`}
            sub={eur(salesValueCents)}
            accent="text-brand-gray-900"
          />
          <StatCard
            title="Internetu"
            value={`${overview.onlineUnits} vnt.`}
            sub={eur(overview.onlineValueCents)}
            accent="text-blue-600"
          />
          <StatCard
            title="Vadybininkės"
            value={`${overview.repUnits} vnt.`}
            sub={eur(overview.repValueCents)}
            accent="text-indigo-600"
          />
          <StatCard
            title="Priimta"
            value={`${overview.receivingUnits} vnt.`}
            sub="į sandėlį"
            accent="text-emerald-600"
          />
          <StatCard
            title="Nurašyta"
            value={`${overview.writeoffUnits} vnt.`}
            sub={`savik. ${eur(overview.writeoffCostCents)}`}
            accent="text-red-600"
          />
          <StatCard
            title="Revizijos"
            value={`${revisions.length}`}
            sub={`${revTotalDelta > 0 ? '+' : ''}${revTotalDelta} vnt · ${eur(revValueCents, true)}`}
            accent={revValueCents < 0 ? 'text-red-600' : 'text-brand-gray-900'}
          />
        </div>
        <p className="text-[11px] text-brand-gray-400">
          Vertė pardavimams skaičiuojama pagal dabartinę mažmeninę kainą
          (apytiksliai), nurašymams — pagal savikainą.
        </p>
      </section>

      {/* ── KAS KIEK KUR PARDAVĖ ── */}
      <section className="grid lg:grid-cols-2 gap-4">
        {/* Pagal kanalą */}
        <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#eee] font-bold text-brand-gray-900 text-sm">
            Pardavimai pagal kanalą
          </div>
          <table className="w-full text-sm">
            <tbody>
              <ChannelRow label="Internetas" units={overview.onlineUnits} value={overview.onlineValueCents} cls="bg-blue-500" />
              <ChannelRow label="Vadybininkės" units={overview.repUnits} value={overview.repValueCents} cls="bg-indigo-500" />
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#eee] font-bold">
                <td className="px-4 py-2.5">Iš viso</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{salesUnits} vnt.</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{eur(salesValueCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagal vadybininkę */}
        <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#eee] font-bold text-brand-gray-900 text-sm">
            Kas pardavė (vadybininkės)
          </div>
          {overview.byRep.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-brand-gray-400">
              Šiuo laikotarpiu vadybininkių pardavimų nėra.
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {overview.byRep.map((r) => (
                  <tr key={r.repId} className="border-t border-[#f3f3f3]">
                    <td className="px-4 py-2.5 font-medium text-brand-gray-900">{r.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{r.units} vnt.</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-brand-gray-500">{eur(r.valueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── TOP PREKĖS ── */}
      {overview.topProducts.length > 0 && (
        <section className="bg-white rounded-xl border border-[#eee] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#eee] font-bold text-brand-gray-900 text-sm">
            Perkamiausios prekės
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-4 py-2 text-left w-8">#</th>
                <th className="px-4 py-2 text-left">Prekė</th>
                <th className="px-4 py-2 text-right w-24">Parduota</th>
                <th className="px-4 py-2 text-right w-28">Vertė</th>
              </tr>
            </thead>
            <tbody>
              {overview.topProducts.map((p, i) => (
                <tr key={p.productId} className="border-t border-[#f3f3f3]">
                  <td className="px-4 py-2 text-brand-gray-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2">
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.name}
                    {p.sku && <span className="text-[11px] text-brand-gray-400 font-mono ml-1">{p.sku}</span>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">{p.units} vnt.</td>
                  <td className="px-4 py-2 text-right tabular-nums text-brand-gray-500">{eur(p.valueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── REVIZIJŲ ISTORIJA ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.5px] text-brand-gray-500">
            Revizijos
          </h3>
          <Link
            href="/admin/sandelis/revizija"
            className="print-hide text-[12px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
          >
            + Nauja revizija
          </Link>
        </div>
        {revisions.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-brand-gray-500 bg-white border border-[#eee] rounded-xl">
            Šiuo laikotarpiu revizijų nebuvo.
          </div>
        ) : (
          <div className="space-y-3">
            {revisions.map((rev) => (
              <details key={rev.id} className="bg-white rounded-xl border border-[#eee] overflow-hidden group">
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3 flex-wrap hover:bg-[#F9F9FB]">
                  <span className="font-bold text-brand-gray-900">
                    {DT.format(new Date(rev.created_at))}
                  </span>
                  <span className="text-sm text-brand-gray-500">
                    Pozicijų: <strong className="text-brand-gray-900">{rev.applied_count}</strong>
                    {' · '}Vnt.:{' '}
                    <strong className={rev.total_delta < 0 ? 'text-red-600' : 'text-emerald-600'}>
                      {rev.total_delta > 0 ? '+' : ''}{rev.total_delta}
                    </strong>
                    {' · '}Vertė:{' '}
                    <strong className={rev.value_change_cents < 0 ? 'text-red-600' : 'text-emerald-600'}>
                      {eur(rev.value_change_cents, true)}
                    </strong>
                  </span>
                </summary>
                <table className="w-full text-sm border-t border-[#eee]">
                  <thead>
                    <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                      <th className="px-3 py-2 text-left">Prekė</th>
                      <th className="px-3 py-2 text-center w-20">Buvo</th>
                      <th className="px-3 py-2 text-center w-20">Rasta</th>
                      <th className="px-3 py-2 text-center w-20">Skirt.</th>
                      <th className="px-3 py-2 text-right w-28">Vertė</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rev.details ?? []).map((d) => (
                      <tr key={d.productId} className="border-t border-[#f3f3f3]">
                        <td className="px-3 py-1.5">
                          {d.colorNumber ? `${d.colorNumber} · ` : ''}
                          {d.name}
                          {d.sku && <span className="text-[11px] text-brand-gray-400 font-mono ml-1">{d.sku}</span>}
                        </td>
                        <td className="px-3 py-1.5 text-center text-brand-gray-500">{d.system}</td>
                        <td className="px-3 py-1.5 text-center font-semibold">{d.counted}</td>
                        <td className={`px-3 py-1.5 text-center font-bold ${d.diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {d.diff > 0 ? '+' : ''}{d.diff}
                        </td>
                        <td className={`px-3 py-1.5 text-right ${d.valueCents < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {eur(d.valueCents, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* ── SMULKI ISTORIJA (judėjimai) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.5px] text-brand-gray-500">
            Smulki istorija (judėjimai)
          </h3>
          <Link
            href="/admin/sandelis/zurnalas"
            className="print-hide text-[12px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
          >
            Visas žurnalas →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
          {movements.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-brand-gray-500">
              Šiuo laikotarpiu judėjimų nėra.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                    <th className="px-4 py-2.5 text-left">Data</th>
                    <th className="px-4 py-2.5 text-left">Prekė</th>
                    <th className="px-4 py-2.5 text-center">Tipas</th>
                    <th className="px-4 py-2.5 text-right">Pokytis</th>
                    <th className="px-4 py-2.5 text-right">Likutis po</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-t border-[#eee] hover:bg-[#F9F9FB]">
                      <td className="px-4 py-2 text-brand-gray-500 text-[12px] whitespace-nowrap">
                        {DT.format(new Date(m.createdAt))}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-brand-gray-900">
                          {m.colorNumber ? `${m.colorNumber} · ` : ''}
                          {m.productName}
                        </span>
                        {m.sku && <span className="text-[11px] text-brand-gray-400 font-mono ml-1">{m.sku}</span>}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${REASON_CLS[m.reason] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {REASON_LABEL[m.reason] ?? m.reason}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right font-bold tabular-nums ${m.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </td>
                      <td className="px-4 py-2 text-right text-brand-gray-900 tabular-nums">{m.balanceAfter ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-[12px] text-brand-gray-500">
          Rodoma {movements.length} naujausių judėjimų laikotarpiu. Visą sąrašą su
          eksportu rasite{' '}
          <Link href="/admin/sandelis/zurnalas" className="font-semibold text-brand-magenta hover:underline">
            sandėlio žurnale
          </Link>
          .
        </p>
      </section>
    </div>
  )
}

function StatCard({
  title,
  value,
  sub,
  accent,
}: {
  title: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#eee] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-400">
        {title}
      </div>
      <div className={`mt-1 text-xl font-bold ${accent}`}>{value}</div>
      <div className="text-[11px] text-brand-gray-500 mt-0.5">{sub}</div>
    </div>
  )
}

function ChannelRow({
  label,
  units,
  value,
  cls,
}: {
  label: string
  units: number
  value: number
  cls: string
}) {
  return (
    <tr className="border-t border-[#f3f3f3]">
      <td className="px-4 py-2.5">
        <span className="inline-flex items-center gap-2 font-medium text-brand-gray-900">
          <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
          {label}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{units} vnt.</td>
      <td className="px-4 py-2.5 text-right tabular-nums text-brand-gray-500">{eur(value)}</td>
    </tr>
  )
}

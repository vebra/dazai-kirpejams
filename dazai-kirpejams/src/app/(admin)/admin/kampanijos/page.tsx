import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getCampaigns,
  getApprovedUsersCount,
} from '@/lib/admin/marketing-queries'
import { duplicateCampaignAction } from './actions'

export const metadata = { title: 'Kampanijos' }
export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Juodraštis',
  sending: 'Siunčiama…',
  sent: 'Išsiųsta',
  failed: 'Nepavyko',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  sending: 'bg-sky-50 text-sky-700 border-sky-200',
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
}

export default async function CampaignsPage({
  searchParams,
}: PageProps<'/admin/kampanijos'>) {
  await requireAdmin()
  const sp = await searchParams
  const deletedFlag = sp.deleted === '1'
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined

  const [campaigns, approvedCount] = await Promise.all([
    getCampaigns(),
    getApprovedUsersCount(),
  ])

  const dateFmt = new Intl.DateTimeFormat('lt-LT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">Kampanijos</h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            El. laiškai patvirtintiems profesionalams. Šiuo metu DB yra{' '}
            <strong>{approvedCount}</strong> patvirtint
            {approvedCount === 1 ? 'as' : 'i'} vartoto
            {approvedCount === 1 ? 'jas' : 'jai'}.
          </p>
        </div>
        <Link
          href="/admin/kampanijos/nauja"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-magenta text-white text-sm font-semibold rounded-lg hover:bg-brand-magenta/90 transition-colors"
        >
          + Nauja kampanija
        </Link>
      </div>

      {deletedFlag && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          Kampanija ištrinta.
        </div>
      )}
      {errorParam && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorParam === 'not-found'
            ? 'Kampanija nerasta.'
            : errorParam === 'cannot-delete-sent'
              ? 'Negalima ištrinti išsiųstos kampanijos.'
              : `Klaida: ${errorParam}`}
        </div>
      )}

      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
            Kol kas nei vienos kampanijos. Sukurkite pirmąją per „+ Nauja kampanija".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Pavadinimas</th>
                  <th className="px-4 py-3 text-left">Tema</th>
                  <th className="px-4 py-3 text-left w-[120px]">Statusas</th>
                  <th className="px-4 py-3 text-center w-[100px]">Gavėjai</th>
                  <th className="px-4 py-3 text-right w-[160px]">Sukurta</th>
                  <th className="px-4 py-3 text-center w-[100px]">Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-[#eee] hover:bg-[#FAFAFB]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/kampanijos/${c.id}`}
                        className="font-medium text-brand-gray-900 hover:text-brand-magenta"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 truncate max-w-xs">
                      {c.subject}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_COLORS[c.status] ?? STATUS_COLORS.draft}`}
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-brand-gray-900 tabular-nums">
                      {c.status === 'sent' || c.status === 'failed' ? (
                        <span>
                          {c.sentCount}
                          {c.failedCount > 0 && (
                            <span className="text-red-600"> / {c.failedCount} ❌</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-brand-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-gray-500 text-[12px]">
                      {dateFmt.format(new Date(c.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <form action={duplicateCampaignAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="text-[11px] font-semibold text-brand-magenta hover:text-brand-magenta/80 hover:underline"
                          title="Sukurti naują juodraštį pagal šią kampaniją"
                        >
                          📋 Klonuoti
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getCampaignById,
  getCampaignRecipients,
  getApprovedUsersCount,
  getApprovedUsersWithNotes,
} from '@/lib/admin/marketing-queries'
import {
  updateCampaignAction,
  deleteCampaignAction,
  sendTestCampaignAction,
  duplicateCampaignAction,
} from '../actions'
import { RecipientPicker } from '../RecipientPicker'
import { CampaignImagePicker } from '../CampaignImagePicker'

export const metadata = { title: 'Kampanija' }
export const dynamic = 'force-dynamic'
// Kampanijos siuntimo Server Action (sendCampaignAction) — ilgas ciklas
// (~0.7 s vienam gavėjui dėl Resend rate-limit delay). Default funkcijos
// limitas nutrauktų siuntimą vidury ir kampanija amžinai liktų 'sending'.
// 60 s — max leidžiamas Hobby plano laikas; Server Action'ai paveldi
// puslapio, iš kurio kviečiami, segmento konfigūraciją.
export const maxDuration = 60

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

const RECIPIENT_STATUS_COLORS: Record<string, string> = {
  pending: 'text-brand-gray-500',
  sent: 'text-emerald-700',
  failed: 'text-red-600',
}

export default async function CampaignDetailPage({
  params,
  searchParams,
}: PageProps<'/admin/kampanijos/[id]'>) {
  await requireAdmin()
  const { id } = await params
  const sp = await searchParams

  const [campaign, recipients, approvedCount, approvedUsers] = await Promise.all([
    getCampaignById(id),
    getCampaignRecipients(id),
    getApprovedUsersCount(),
    getApprovedUsersWithNotes(),
  ])

  if (!campaign) notFound()

  const isDraft = campaign.status === 'draft'
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const savedFlag = sp.saved === '1'
  const createdFlag = sp.created === '1'
  const testSentFlag = sp['test-sent'] === '1'
  const sentFlag = sp.sent === '1'
  const notesSavedFlag = sp['notes-saved'] === '1'
  const duplicatedFlag = sp.duplicated === '1'
  const totalParam = typeof sp.total === 'string' ? sp.total : null
  const failedParam = typeof sp.failed === 'string' ? sp.failed : null

  const dateFmt = new Intl.DateTimeFormat('lt-LT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/kampanijos"
          className="text-sm text-brand-gray-500 hover:text-brand-gray-900"
        >
          ← Kampanijos
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-brand-gray-900">
              {campaign.name}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_COLORS[campaign.status]}`}
            >
              {STATUS_LABELS[campaign.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-brand-gray-500">
            Sukurta {dateFmt.format(new Date(campaign.createdAt))}
            {campaign.sentAt && ` · Išsiųsta ${dateFmt.format(new Date(campaign.sentAt))}`}
          </p>
        </div>
      </div>

      {createdFlag && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          Juodraštis sukurtas. Galite atsiųsti testą sau arba siųsti visiems.
        </div>
      )}
      {savedFlag && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          Pakeitimai išsaugoti.
        </div>
      )}
      {testSentFlag && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          Testinė kopija išsiųsta į admin notification el. paštą. Patikrinkite ir, jei viskas gerai, siųskite visiems.
        </div>
      )}
      {notesSavedFlag && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          Pastaba išsaugota.
        </div>
      )}
      {duplicatedFlag && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          Kampanija nuklonuota — galite redaguoti tekstą ir pasirinkti gavėjus.
        </div>
      )}
      {sentFlag && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          Kampanija išsiųsta. Sėkmingai pristatyta: <strong>{totalParam ?? '?'}</strong>
          {failedParam && (
            <span className="text-red-600"> · nepavyko: {failedParam}</span>
          )}
        </div>
      )}
      {errorParam && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorParam === 'cannot-edit-sent'
            ? 'Negalima redaguoti — kampanija jau išsiųsta.'
            : errorParam === 'cannot-delete-sending'
              ? 'Negalima ištrinti — kampanija šiuo metu siunčiama. Palaukit, kol pasibaigs.'
              : errorParam === 'already-sent'
                ? 'Šitą kampaniją jau išsiuntėte. Sukurkite naują, jei norite siųsti kitą laišką.'
                : errorParam === 'no-admin-email'
                  ? 'ADMIN_NOTIFICATION_EMAIL env neapibrėžtas — negaliu siųsti testo.'
                  : errorParam === 'missing-fields'
                    ? 'Visi laukai privalomi.'
                    : `Klaida: ${errorParam}`}
        </div>
      )}

      {/* Redagavimas — tik juodraščiams */}
      {isDraft ? (
        <form
          action={updateCampaignAction}
          className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5"
        >
          <input type="hidden" name="id" value={campaign.id} />
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-900 mb-1.5">
              Vidinis pavadinimas
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={campaign.name}
              className="w-full px-4 py-2.5 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-900 mb-1.5">
              El. laiško tema
            </label>
            <input
              name="subject"
              type="text"
              required
              defaultValue={campaign.subject}
              className="w-full px-4 py-2.5 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-900 mb-1.5">
              Tekstas
            </label>
            <textarea
              name="body"
              required
              rows={12}
              defaultValue={campaign.body}
              className="w-full px-4 py-3 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta font-mono leading-relaxed"
            />
          </div>
          <CampaignImagePicker initialUrl={campaign.imageUrl ?? ''} />
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-brand-gray-900/90 transition-colors"
            >
              Išsaugoti pakeitimus
            </button>
          </div>
        </form>
      ) : (
        <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">
              Tema
            </div>
            <div className="text-sm text-brand-gray-900">{campaign.subject}</div>
          </div>
          {campaign.imageUrl && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">
                Nuotrauka
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={campaign.imageUrl}
                alt="Laiško nuotrauka"
                className="max-w-[400px] w-full rounded-lg border border-[#eee]"
              />
            </div>
          )}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">
              Tekstas
            </div>
            <div className="text-sm text-brand-gray-900 whitespace-pre-wrap font-mono leading-relaxed">
              {campaign.body}
            </div>
          </div>
        </section>
      )}

      {/* Veiksmų zona — testas + gavėjų pasirinkimas */}
      {isDraft && (
        <section className="bg-white rounded-xl border-2 border-brand-magenta/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-bold text-brand-gray-900">Siuntimas</h3>
            <span className="text-[12px] text-brand-gray-500">
              {approvedCount} patvirtin{approvedCount === 1 ? 'tas' : 'ti'} vartoto
              {approvedCount === 1 ? 'jas' : 'jai'} DB
            </span>
          </div>

          <form action={sendTestCampaignAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <button
              type="submit"
              className="px-4 py-2.5 bg-brand-gray-50 border border-[#eee] text-brand-gray-900 text-sm font-semibold rounded-lg hover:bg-brand-gray-50/60 transition-colors"
            >
              📧 Siųsti testą sau (ADMIN_NOTIFICATION_EMAIL)
            </button>
          </form>

          <div className="pt-4 border-t border-[#eee]">
            <div className="mb-3">
              <h4 className="text-sm font-bold text-brand-gray-900">
                Pasirinkite gavėjus
              </h4>
              <p className="text-[12px] text-brand-gray-500 mt-0.5">
                Default&apos;iškai pažymėti visi. Filtruokite arba atžymėkite tuos,
                kuriems šios kampanijos nesiųsti. Pastaba prie kiekvieno
                vartotojo lieka profilyje ir matosi vėliau.
              </p>
            </div>
            <RecipientPicker campaignId={campaign.id} users={approvedUsers} />
          </div>

          <form action={deleteCampaignAction} className="pt-4 border-t border-[#eee]">
            <input type="hidden" name="id" value={campaign.id} />
            <button
              type="submit"
              className="text-[12px] text-red-600 hover:text-red-700 hover:underline"
            >
              Ištrinti juodraštį
            </button>
          </form>
        </section>
      )}

      {/* Klonavimas — galima ir iš sent/failed/sending. Sukuria naują juodraštį
          su tuo pačiu tekstu. Gavėjai persipildo iš naujo (pasirenkat per
          RecipientPicker'į). */}
      {!isDraft && (
        <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-3">
          <h3 className="text-base font-bold text-brand-gray-900">
            Naudoti šitą tekstą iš naujo
          </h3>
          <p className="text-sm text-brand-gray-500">
            Sukuria naują juodraštį su tuo pačiu pavadinimu (su „(kopija)&quot;
            priesaga), tema ir tekstu. Galėsite jį redaguoti, pasirinkti
            naujus gavėjus ir siųsti.
          </p>
          <form action={duplicateCampaignAction}>
            <input type="hidden" name="id" value={campaign.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-brand-gray-900/90 transition-colors"
            >
              📋 Klonuoti į naują juodraštį
            </button>
          </form>

          {/* Ištrynimas — leidžiama bet kokiam statusui (išskyrus „sending").
              CASCADE pašalina ir gavėjų audit eilutes. Negrįžtama. */}
          {campaign.status !== 'sending' && (
            <div className="pt-4 mt-4 border-t border-[#eee]">
              <p className="text-[12px] text-brand-gray-500 mb-2 leading-relaxed">
                Jeigu nebereikia šios kampanijos audit istorijos — galite ją
                ištrinti. <strong>Negrįžtama:</strong> visi gavėjai ir jų
                pristatymo/atidarymo statusai dings.
              </p>
              <form action={deleteCampaignAction}>
                <input type="hidden" name="id" value={campaign.id} />
                <button
                  type="submit"
                  className="text-[12px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                >
                  Ištrinti kampaniją visam laikui
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {/* Audit — gavėjų sąrašas */}
      {recipients.length > 0 && (
        <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eee]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              Gavėjai ({recipients.length})
            </h3>
            <p className="text-[11px] text-brand-gray-500 mt-1.5 leading-relaxed">
              „Atidaryta&quot; — pixel beacon load&apos;as. Gmail/Outlook paveikslus
              proxy&apos;ina iškart gavus laišką, todėl Gmail vartotojams reikšmė
              dažniausiai reiškia „pristatyta į pašto dėžę&quot;, ne tikrą atidarymą.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">El. paštas</th>
                  <th className="px-4 py-3 text-left w-[100px]">Statusas</th>
                  <th className="px-4 py-3 text-right w-[160px]">Siųsta</th>
                  <th className="px-4 py-3 text-left w-[120px]">Atidaryta</th>
                  <th className="px-4 py-3 text-left">Klaida</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id} className="border-t border-[#eee]">
                    <td className="px-4 py-3 text-brand-gray-900 font-mono text-[12px]">
                      {r.email}
                    </td>
                    <td className={`px-4 py-3 text-[12px] font-semibold ${RECIPIENT_STATUS_COLORS[r.status]}`}>
                      {r.status === 'sent' ? '✓ pristatyta' : r.status === 'failed' ? '✗ nepavyko' : '… laukia'}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-brand-gray-500">
                      {r.sentAt ? dateFmt.format(new Date(r.sentAt)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      {r.openedAt ? (
                        <span
                          className="text-emerald-700"
                          title={`Pixel beacon load'ų: ${r.openedCount}`}
                        >
                          👁 {dateFmt.format(new Date(r.openedAt))}
                          {r.openedCount > 1 && (
                            <span className="text-brand-gray-500"> ({r.openedCount})</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-brand-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-red-600">
                      {r.errorMessage ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

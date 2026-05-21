'use client'

import { useState, useMemo } from 'react'
import type { ApprovedUserRow } from '@/lib/admin/marketing-queries'
import {
  sendCampaignAction,
  updateUserAdminNotesAction,
} from './actions'

/**
 * Klientinis komponentas — leidžia admin'ui:
 *  - Filtruoti patvirtintų vartotojų sąrašą (paieška vardu/email/pastaba)
 *  - Atskirti/visus/nė vieno
 *  - Inline redaguoti admin pastabą prie kiekvieno
 *  - Pažymėti pasirinktus checkbox'us — formData.getAll('recipient_id')
 *
 * Pasirinkimas saugomas tik šio komponento state'e (URL'e ne) — jei
 * admin'as išeina, pasirinkimas dingsta. Tai sąmoningas dizainas:
 * kampanijos siuntimas yra vienakartinis veiksmas.
 */
export function RecipientPicker({
  campaignId,
  users,
}: {
  campaignId: string
  users: ApprovedUserRow[]
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(users.map((u) => u.id)) // default: visi pažymėti
  )
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const hay = [
        u.firstName,
        u.lastName,
        u.email,
        u.salonName ?? '',
        u.adminNotes ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [users, search])

  const allSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id))
  const someSelected = filtered.some((u) => selected.has(u.id)) && !allSelected

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const u of filtered) next.delete(u.id)
      } else {
        for (const u of filtered) next.add(u.id)
      }
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Filtras: vardas, el. paštas, salonas, pastaba…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-[#eee] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
        />
        <span className="text-[12px] text-brand-gray-500">
          Pasirinkta: <strong>{selected.size}</strong> iš {users.length}
        </span>
      </div>

      <div className="border border-[#eee] rounded-xl overflow-hidden">
        <div className="bg-[#F9F9FB] px-4 py-2.5 border-b border-[#eee] flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          <input
            type="checkbox"
            aria-label="Pasirinkti visus filtre matomus"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected
            }}
            onChange={toggleAll}
            className="accent-brand-magenta"
          />
          <span className="flex-1">Vartotojas</span>
          <span className="w-[200px] hidden md:block">Pastaba</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-brand-gray-500">
            Nieko nerasta. Pakeiskit filtrą.
          </div>
        ) : (
          <ul className="divide-y divide-[#eee] max-h-[480px] overflow-y-auto">
            {filtered.map((u) => (
              <li
                key={u.id}
                className="px-4 py-3 flex items-start gap-3 hover:bg-[#FAFAFB]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(u.id)}
                  onChange={() => toggleOne(u.id)}
                  className="mt-1 accent-brand-magenta"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-brand-gray-900">
                    {u.firstName} {u.lastName}
                  </div>
                  <div className="text-[12px] text-brand-gray-500 font-mono">
                    {u.email}
                  </div>
                  {u.salonName && (
                    <div className="text-[12px] text-brand-gray-500 mt-0.5">
                      🏢 {u.salonName}
                    </div>
                  )}
                </div>
                <div className="w-full md:w-[200px] mt-2 md:mt-0">
                  <NoteEditor
                    userId={u.id}
                    campaignId={campaignId}
                    initial={u.adminNotes ?? ''}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={sendCampaignAction} className="space-y-3">
        <input type="hidden" name="id" value={campaignId} />
        {/* Kiekvienas pasirinktas vartotojas — atskira hidden input'a su
            tuo pačiu pavadinimu, kad backend gautų array per getAll(). */}
        {Array.from(selected).map((uid) => (
          <input key={uid} type="hidden" name="recipient_id" value={uid} />
        ))}
        <button
          type="submit"
          disabled={selected.size === 0}
          className="w-full px-4 py-3 bg-brand-magenta text-white text-sm font-semibold rounded-lg hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✉️ Siųsti pasirinktiems ({selected.size})
        </button>
        <p className="text-[11px] text-brand-gray-500">
          Negrįžtama. Visi pasirinkti vartotojai gaus laišką per kelias sekundes.
        </p>
      </form>
    </div>
  )
}

function NoteEditor({
  userId,
  campaignId,
  initial,
}: {
  userId: string
  campaignId: string
  initial: string
}) {
  // Inline notes input: kai pasikeičia ir prarandama fokusą — siunčia
  // updateAdminNotes action'ą. Klientinė UI bus „optimistic" tik kiek
  // reikia — pati išlikusi reikšmė ateis po revalidate per puslapio reload.
  return (
    <form action={updateUserAdminNotesAction}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input
        type="text"
        name="admin_notes"
        defaultValue={initial}
        placeholder="Pastaba (pvz. VIP)"
        className="w-full px-2.5 py-1.5 border border-[#eee] rounded-md text-[12px] focus:outline-none focus:border-brand-magenta bg-white"
        onBlur={(e) => {
          if (e.target.value !== initial) {
            // Saugiai pateikiam formą per submit
            e.target.form?.requestSubmit()
          }
        }}
      />
    </form>
  )
}

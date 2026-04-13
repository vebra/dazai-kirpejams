'use client'

import { useState, useActionState, useRef, useEffect } from 'react'
import {
  addAdminAction,
  removeAdminAction,
  type AddAdminState,
} from './actions'
import type { AdminUserRow } from '@/lib/admin/queries'

const initialState: AddAdminState = {}

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
})

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

export function AdminsManager({
  admins,
  currentAdminId,
}: {
  admins: AdminUserRow[]
  currentAdminId: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [state, formAction, isPending] = useActionState(
    addAdminAction,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Po sėkmingo pridėjimo — išvalom ir uždarom formą
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setShowForm(false)
    }
  }, [state.success])

  return (
    <div className="space-y-5">
      {/* Antraštė su „Pridėti" mygtuku */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-brand-gray-500">
          Iš viso:{' '}
          <strong className="text-brand-gray-900">{admins.length}</strong>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
          >
            + Pridėti administratorių
          </button>
        )}
      </div>

      {/* Nauja forma */}
      {showForm && (
        <form
          ref={formRef}
          action={formAction}
          className="p-5 bg-[#F9F9FB] border border-[#eee] rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-[13px] font-bold text-brand-gray-900">
              Naujas administratorius
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[12px] text-brand-gray-500 hover:text-brand-gray-900"
            >
              Uždaryti
            </button>
          </div>

          {state.error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
            >
              El. paštas *
            </label>
            <input
              type="email"
              id="admin-email"
              name="email"
              required
              placeholder="vardas@dazaikirpejams.lt"
              className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
            <p className="mt-1 text-[11px] text-brand-gray-500">
              Vartotojas privalo jau būti prisiregistravęs sistemoje. Jei dar
              ne — paprašykite jo prisiregistruoti per login puslapį ir tada
              pridėkite iš naujo.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Pridedama…' : 'Pridėti'}
            </button>
          </div>
        </form>
      )}

      {/* Adminų lentelė */}
      {admins.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-xl">
          Administratorių nėra.
        </div>
      ) : (
        <div className="border border-[#eee] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">El. paštas</th>
                  <th className="px-4 py-3 text-left w-[140px]">
                    Pridėtas
                  </th>
                  <th className="px-4 py-3 text-right w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => {
                  const isSelf = a.id === currentAdminId
                  return (
                    <tr
                      key={a.id}
                      className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-brand-gray-900">
                            {a.email}
                          </span>
                          {isSelf && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                              Jūs
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isSelf ? (
                          <span className="text-[11px] text-brand-gray-500">
                            —
                          </span>
                        ) : (
                          <form action={removeAdminAction} className="inline">
                            <input type="hidden" name="id" value={a.id} />
                            <button
                              type="submit"
                              onClick={(e) => {
                                if (
                                  !confirm(
                                    `Ar tikrai pašalinti ${a.email} iš administratorių?`
                                  )
                                ) {
                                  e.preventDefault()
                                }
                              }}
                              className="px-2.5 py-1 bg-white border border-[#ddd] rounded text-[11px] font-semibold text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                            >
                              Pašalinti
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

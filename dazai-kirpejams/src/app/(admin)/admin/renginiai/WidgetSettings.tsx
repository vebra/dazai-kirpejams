'use client'

import { useState } from 'react'
import { saveWidgetPrefsAction } from './actions'
import {
  EVENT_WIDGET_LABELS,
  type EventWidgetKey,
  type EventWidgetPrefs,
} from '@/lib/admin/event-widgets-shared'

const WIDGET_GROUPS: Array<{ title: string; keys: EventWidgetKey[] }> = [
  {
    title: 'Apžvalga',
    keys: ['countdown', 'capacity', 'kpi', 'reminderStatus'],
  },
  {
    title: 'Statistika',
    keys: ['roleDistribution', 'timeline'],
  },
  {
    title: 'Veiksmai ir lentelė',
    keys: ['bulkActions', 'manualEmail', 'notes', 'csvExport', 'printView'],
  },
]

export function WidgetSettings({ prefs }: { prefs: EventWidgetPrefs }) {
  const [open, setOpen] = useState(false)
  const enabledCount = Object.values(prefs).filter(Boolean).length
  const totalCount = Object.keys(prefs).length

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-white border border-[#ddd] hover:border-brand-magenta text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5"
        aria-label="Widget'ų nustatymai"
      >
        <span aria-hidden="true">⚙</span>
        Rodyti ({enabledCount}/{totalCount})
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#eee] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-brand-gray-900">
                  Rodyti / slėpti
                </h3>
                <p className="text-[12px] text-brand-gray-500 mt-0.5">
                  Pasirinkite, kuriuos blokus matyti šiame puslapyje.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-brand-gray-500 hover:text-brand-gray-900 text-2xl leading-none"
                aria-label="Uždaryti"
              >
                ×
              </button>
            </div>

            <form action={saveWidgetPrefsAction} className="p-6 space-y-5">
              {WIDGET_GROUPS.map((group) => (
                <div key={group.title}>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-2">
                    {group.title}
                  </h4>
                  <div className="space-y-2">
                    {group.keys.map((key) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F9F9FB] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          name={`w_${key}`}
                          defaultChecked={prefs[key]}
                          className="w-4 h-4 accent-brand-magenta"
                        />
                        <span className="text-sm text-brand-gray-900">
                          {EVENT_WIDGET_LABELS[key]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-4 border-t border-[#eee]">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Išsaugoti
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-sm font-semibold transition-colors"
                >
                  Atšaukti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

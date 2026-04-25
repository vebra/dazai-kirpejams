/**
 * Client + server saugios konstantos renginių dashboard'ui. Šis failas
 * neturi `server-only` markerio, tad jį gali importuoti ir client komponentai
 * (pvz. WidgetSettings.tsx). Cookie skaitymo/rašymo logika gyvena atskirai
 * `event-widgets.ts` faile su `server-only` apsauga.
 */

export type EventWidgetKey =
  | 'countdown'
  | 'capacity'
  | 'kpi'
  | 'reminderStatus'
  | 'roleDistribution'
  | 'timeline'
  | 'csvExport'
  | 'printView'
  | 'manualEmail'
  | 'bulkActions'
  | 'notes'

export type EventWidgetPrefs = Record<EventWidgetKey, boolean>

export const EVENT_WIDGET_DEFAULTS: EventWidgetPrefs = {
  countdown: true,
  capacity: true,
  kpi: true,
  reminderStatus: true,
  roleDistribution: true,
  timeline: true,
  csvExport: true,
  printView: true,
  manualEmail: true,
  bulkActions: true,
  notes: true,
}

export const EVENT_WIDGET_LABELS: Record<EventWidgetKey, string> = {
  countdown: 'Atgalinis laikrodis',
  capacity: 'Vietų likučio juosta',
  kpi: 'KPI kortelės',
  reminderStatus: 'Priminimo būsena',
  roleDistribution: 'Pareigų paskirstymas',
  timeline: 'Registracijų grafikas',
  csvExport: 'CSV eksportas',
  printView: 'Spausdinamas sąrašas',
  manualEmail: 'Rankinis email siuntimas',
  bulkActions: 'Masiniai veiksmai',
  notes: 'Pastabos prie registracijos',
}

import 'server-only'
import { cookies } from 'next/headers'
import {
  EVENT_WIDGET_DEFAULTS,
  type EventWidgetPrefs,
} from './event-widgets-shared'

export {
  EVENT_WIDGET_DEFAULTS,
  EVENT_WIDGET_LABELS,
  type EventWidgetKey,
  type EventWidgetPrefs,
} from './event-widgets-shared'

const COOKIE_NAME = 'admin-event-widgets'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function getEventWidgetPrefs(): Promise<EventWidgetPrefs> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return EVENT_WIDGET_DEFAULTS

  try {
    const parsed = JSON.parse(raw) as Partial<EventWidgetPrefs>
    return { ...EVENT_WIDGET_DEFAULTS, ...parsed }
  } catch {
    return EVENT_WIDGET_DEFAULTS
  }
}

export async function saveEventWidgetPrefs(
  prefs: EventWidgetPrefs
): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify(prefs), {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
  })
}

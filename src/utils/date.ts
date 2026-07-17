import { format } from 'date-fns'
import { getBusinessTimeZone } from './timezone'

/**
 * Today's date as an ISO `yyyy-MM-dd` string, suitable for date-input `min`
 * values and the default "upcoming from today" view.
 */
export function todayISODate(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/*
 * Displayed dates/times are formatted in the business timezone (not the viewer's
 * browser zone or the offset baked into the API timestamp). The Intl formatters
 * are cached and only rebuilt if that timezone changes, since they are called per
 * marker/row.
 */
let cachedTimeZone: string | undefined
let dateFormatter: Intl.DateTimeFormat
let timeFormatter: Intl.DateTimeFormat

function ensureFormatters(): void {
  const timeZone = getBusinessTimeZone()
  if (timeZone === cachedTimeZone) return
  cachedTimeZone = timeZone
  dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** Format an appointment datetime as a readable date in the user's timezone, e.g. "Jul 24, 2026". */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  ensureFormatters()
  return dateFormatter.format(date)
}

/** Format an appointment datetime as a readable time in the user's timezone, e.g. "9:00 PM". */
export function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  ensureFormatters()
  return timeFormatter.format(date)
}

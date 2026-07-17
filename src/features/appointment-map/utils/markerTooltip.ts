import { escapeHtml } from '@/utils/escapeHtml'
import { formatDate, formatTime } from '@/utils/date'
import { getBusinessTimeZone } from '@/utils/timezone'
import type {
  BusyEvent,
  UnifiedAppointment,
} from '@/features/appointments/types/appointment.types'

/** Class on the tooltip's "View All Appointments" button; wired on `tooltipopen`. */
export const TOOLTIP_ACTION_CLASS = 'tooltip-action-btn'

const viewAllButton =
  `<button type="button" class="${TOOLTIP_ACTION_CLASS}" title="View all appointments for this representative">` +
  `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3" y2="6"/><line x1="3" y1="12" x2="3" y2="12"/><line x1="3" y1="18" x2="3" y2="18"/></svg>` +
  `View All Appointments</button>`

/**
 * Build the hover tooltip HTML for an appointment marker (contact name heading +
 * key appointment details). Values are HTML-escaped.
 */
export function buildAppointmentTooltip(
  appointment: UnifiedAppointment,
  repName: string,
): string {
  const rows: Array<[string, string]> = [
    ['Representative', repName],
    ['Company', appointment.companyName],
    ['Status', appointment.status],
    [
      'Start',
      `${formatDate(appointment.startTime)} ${formatTime(appointment.startTime)}`.trim(),
    ],
    [
      'End',
      `${formatDate(appointment.endTime)} ${formatTime(appointment.endTime)}`.trim(),
    ],
    ['Time Zone', getBusinessTimeZone()],
    ['Address', appointment.fullAddress || appointment.address],
    [
      'Coordinates',
      appointment.coords
        ? `${appointment.coords.lat.toFixed(5)}, ${appointment.coords.lng.toFixed(5)}`
        : '',
    ],
  ]

  const body = rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<div><b>${label}:</b> ${escapeHtml(value)}</div>`)
    .join('')

  return `<div class="appt-tooltip"><strong>${escapeHtml(appointment.contactName)}</strong>${body}${viewAllButton}</div>`
}

/**
 * Build the hover tooltip HTML for a Busy marker. Busy slots carry no contact, so
 * only representative/date/time/address are shown, followed by the same
 * "View All Appointments" button as an appointment marker. Values are HTML-escaped.
 */
export function buildBusyTooltip(busy: BusyEvent, repName: string): string {
  const rows: Array<[string, string]> = [
    ['Representative', repName],
    ['Date', formatDate(busy.startTime)],
    ['Time', busy.isFullDay ? 'All day' : formatTime(busy.startTime)],
    ['Address', busy.address],
  ]

  const body = rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<div><b>${label}:</b> ${escapeHtml(value)}</div>`)
    .join('')

  return `<div class="appt-tooltip"><strong>${escapeHtml(busy.title || 'Busy')}</strong>${body}${viewAllButton}</div>`
}

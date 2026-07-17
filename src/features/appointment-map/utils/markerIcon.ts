import L from 'leaflet'
import { escapeHtml } from '@/utils/escapeHtml'

/**
 * Build an always-visible marker: a location pin (rep color) with a label showing
 * the start date, time and representative name. The border color distinguishes
 * marker kinds.
 */
function buildMarkerIcon(
  color: string,
  borderColor: string,
  borderWidth: number,
  date: string,
  time: string,
  repName: string,
): L.DivIcon {
  const safeColor = escapeHtml(color)
  const safeBorder = escapeHtml(borderColor)
  const dateHtml = date
    ? `<span class="appt-date">${escapeHtml(date)}</span>`
    : ''
  const timeHtml = time
    ? `<span class="appt-time">${escapeHtml(time)}</span>`
    : ''

  const pin =
    `<svg class="appt-pin-svg" viewBox="0 0 24 36" width="28" height="42" aria-hidden="true">` +
    `<path d="M12 0C5.383 0 0 5.383 0 12c0 8.25 12 24 12 24s12-15.75 12-24C24 5.383 18.617 0 12 0z" fill="${safeColor}" stroke="${safeBorder}" stroke-width="${borderWidth}"/>` +
    `<circle cx="12" cy="12" r="4.5" fill="#ffffff"/>` +
    `</svg>`

  const html =
    `<div class="appt-marker-inner">` +
    `<div class="appt-label">${dateHtml}${timeHtml}<span class="appt-rep">${escapeHtml(repName)}</span></div>` +
    pin +
    `</div>`

  return L.divIcon({
    className: 'appt-marker',
    html,
    iconSize: [140, 76],
    iconAnchor: [70, 76],
  })
}

/** Appointment marker: rep-color pin with a white border. */
export function createAppointmentIcon(
  color: string,
  date: string,
  time: string,
  repName: string,
): L.DivIcon {
  return buildMarkerIcon(color, '#ffffff', 1.5, date, time, repName)
}

/** Busy marker: same rep color, distinguished by a black border (CLAUDE §16). */
export function createBusyIcon(
  color: string,
  date: string,
  time: string,
  repName: string,
): L.DivIcon {
  return buildMarkerIcon(color, '#000000', 2.5, date, time, repName)
}

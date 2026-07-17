import type { UnifiedAppointment } from '@/features/appointments/types/appointment.types'

/** Ring radius (degrees, ~40m) used to fan out same-location appointments. */
const SPREAD_RADIUS = 0.00035

/** Group appointments (with coords) by their rounded coordinate. */
function groupByCoord(
  appointments: UnifiedAppointment[],
): UnifiedAppointment[][] {
  const groups = new Map<string, UnifiedAppointment[]>()
  for (const appointment of appointments) {
    if (!appointment.coords) continue
    const key = `${appointment.coords.lat.toFixed(5)},${appointment.coords.lng.toFixed(5)}`
    const existing = groups.get(key)
    if (existing) existing.push(appointment)
    else groups.set(key, [appointment])
  }
  return [...groups.values()]
}

/**
 * Position for a marker within its same-location group. A single appointment
 * stays on its exact coordinate; multiple appointments sharing a coordinate are
 * fanned out evenly around a small ring so each is visible and clickable.
 */
function spreadPosition(
  lat: number,
  lng: number,
  index: number,
  count: number,
): [number, number] {
  if (count <= 1) return [lat, lng]
  const angle = (2 * Math.PI * index) / count
  return [lat + SPREAD_RADIUS * Math.cos(angle), lng + SPREAD_RADIUS * Math.sin(angle)]
}

/**
 * Map of appointment id → the exact on-map position where its marker is drawn.
 * Because same-location appointments are fanned into a ring, the drawn position
 * differs from the raw geocoded coordinate; sharing this map lets callers (marker
 * rendering AND the "go to appointment" fly) target the marker exactly instead of
 * the ring centre. Appointments without coordinates are omitted (no marker drawn).
 */
export function computeMarkerPositions(
  appointments: UnifiedAppointment[],
): Map<string, [number, number]> {
  const positions = new Map<string, [number, number]>()
  for (const group of groupByCoord(appointments)) {
    group.forEach((appointment, index) => {
      positions.set(
        appointment.id,
        spreadPosition(
          appointment.coords!.lat,
          appointment.coords!.lng,
          index,
          group.length,
        ),
      )
    })
  }
  return positions
}

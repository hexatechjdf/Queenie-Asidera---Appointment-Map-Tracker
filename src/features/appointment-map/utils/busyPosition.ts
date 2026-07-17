import { MAP_DEFAULT_CENTER } from '@/constants/map.constants'
import type { AppointmentCoords } from '@/features/appointments/types/appointment.types'

/** Tight scatter (degrees) around an anchor when appointments are on the map. */
const NEAR_SPREAD = 0.18
/** Wide scatter around the world map center when there is no anchor. */
const FAR_SPREAD_LAT = 25
const FAR_SPREAD_LNG = 60

const [BASE_LAT, BASE_LNG] = MAP_DEFAULT_CENTER as [number, number]

/** Stable FNV-1a string hash → unsigned 32-bit int. */
function hash(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Deterministic pseudo-position for a Busy marker. Busy events carry no real
 * location; this scatters them so they are visible, keyed by the event id so the
 * same event always lands in the same spot (no `Math.random`, no per-render
 * drift). Informational only, NOT a real geographic location.
 *
 * When an `anchor` is given (the centroid of loaded appointments), Busy markers
 * are scattered tightly around it so they sit next to the real appointments;
 * otherwise they scatter around the world map center so they remain visible.
 */
export function pseudoBusyPosition(
  id: string,
  anchor?: AppointmentCoords | null,
): AppointmentCoords {
  const h = hash(id)
  // Two independent fractions in [0, 1) from different halves of the hash.
  const fracLat = (h & 0xffff) / 0x10000
  const fracLng = ((h >>> 16) & 0xffff) / 0x10000

  const baseLat = anchor ? anchor.lat : BASE_LAT
  const baseLng = anchor ? anchor.lng : BASE_LNG
  const spreadLat = anchor ? NEAR_SPREAD : FAR_SPREAD_LAT
  const spreadLng = anchor ? NEAR_SPREAD : FAR_SPREAD_LNG

  const lat = baseLat + (fracLat * 2 - 1) * spreadLat
  const lng = baseLng + (fracLng * 2 - 1) * spreadLng

  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  }
}

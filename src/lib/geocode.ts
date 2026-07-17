import { loadGoogleMaps } from './googleMaps'
import type { AppointmentCoords } from '@/features/appointments/types/appointment.types'

/**
 * Address → coordinates via the Google Maps Places text search (matching the
 * lead's reference implementation), cached in memory and localStorage (never
 * written back to GHL, per the read-only rule). Best-effort: failures resolve to
 * null so callers can proceed without coordinates.
 */

const STORAGE_KEY = 'appointment-map:geocode-cache'
const memoryCache = new Map<string, AppointmentCoords | null>()

let placesService: google.maps.places.PlacesService | null = null

function readPersisted(): Record<string, AppointmentCoords> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, AppointmentCoords>) : {}
  } catch {
    return {}
  }
}

function persist(key: string, coords: AppointmentCoords): void {
  try {
    const all = readPersisted()
    all[key] = coords
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Ignore storage failures (e.g. private mode / quota).
  }
}

interface LookupResult {
  coords: AppointmentCoords | null
  /** Whether this is a settled result worth caching (vs. a transient/denied status). */
  cacheable: boolean
}

async function lookup(address: string): Promise<LookupResult> {
  const maps = await loadGoogleMaps()
  if (!placesService) {
    placesService = new maps.places.PlacesService(document.createElement('div'))
  }
  const status = maps.places.PlacesServiceStatus

  return new Promise<LookupResult>((resolve) => {
    placesService!.textSearch({ query: address }, (results, resultStatus) => {
      const location =
        resultStatus === status.OK ? results?.[0]?.geometry?.location : undefined

      if (location) {
        resolve({ coords: { lat: location.lat(), lng: location.lng() }, cacheable: true })
      } else if (resultStatus === status.ZERO_RESULTS) {
        // Genuine "not found" — safe to cache so we don't re-query.
        resolve({ coords: null, cacheable: true })
      } else {
        // Transient/denied (e.g. OVER_QUERY_LIMIT, REQUEST_DENIED) — keep retryable.
        resolve({ coords: null, cacheable: false })
      }
    })
  })
}

export async function geocodeAddress(
  address: string,
): Promise<AppointmentCoords | null> {
  const key = address.trim().toLowerCase()
  if (!key) return null

  if (memoryCache.has(key)) return memoryCache.get(key) ?? null

  const persisted = readPersisted()
  if (persisted[key]) {
    memoryCache.set(key, persisted[key])
    return persisted[key]
  }

  try {
    const { coords, cacheable } = await lookup(address)
    if (cacheable) {
      memoryCache.set(key, coords)
      if (coords) persist(key, coords)
    }
    return coords
  } catch {
    // SDK load or unexpected errors are not cached, so they can be retried later.
    return null
  }
}

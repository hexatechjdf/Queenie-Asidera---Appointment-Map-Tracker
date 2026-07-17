/**
 * Loads the Google Maps JavaScript SDK once and resolves with its `maps`
 * namespace. Used for geocoding (and later Places Autocomplete). The API key
 * comes from the runtime config layer (parent-provided key, falling back to the
 * environment). Google is the sole geocoding provider per the meeting decisions;
 * the map itself is rendered with Leaflet.
 */

import { loadRuntimeConfig } from '@/services/config/runtimeConfig'

type GoogleMaps = typeof google.maps

let loadPromise: Promise<GoogleMaps> | null = null

function existingMaps(): GoogleMaps | undefined {
  return (window as unknown as { google?: { maps?: GoogleMaps } }).google?.maps
}

async function loadSdk(): Promise<GoogleMaps> {
  const { googleMapsKey: key } = await loadRuntimeConfig()
  if (!key) throw new Error('Missing Google Maps API key')

  const alreadyLoaded = existingMaps()
  if (alreadyLoaded) return alreadyLoaded

  return new Promise<GoogleMaps>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      const maps = existingMaps()
      if (maps) resolve(maps)
      else reject(new Error('Google Maps loaded without a maps namespace'))
    }
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

export function loadGoogleMaps(): Promise<GoogleMaps> {
  if (!loadPromise) loadPromise = loadSdk()
  return loadPromise
}

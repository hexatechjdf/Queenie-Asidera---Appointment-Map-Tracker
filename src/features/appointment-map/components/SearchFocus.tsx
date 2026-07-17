import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { escapeHtml } from '@/utils/escapeHtml'
import searchPinUrl from '@/assets/search-pin.png'
import type { SearchLocation } from '@/features/search/types'

const searchIcon = L.icon({
  iconUrl: searchPinUrl,
  className: 'search-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -34],
})

/**
 * Pans/zooms the map to a searched location and drops a distinct search pin.
 * Renders nothing; it drives the imperative Leaflet map via useMap().
 */
export function SearchFocus({ location }: { location: SearchLocation | null }) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!location) return

    const marker = L.marker([location.lat, location.lng], { icon: searchIcon })
    if (location.label) {
      // Open the label immediately; autoPan off so it doesn't fight the flyTo.
      marker.bindPopup(`<b>${escapeHtml(location.label)}</b>`, { autoPan: false })
    }
    marker.addTo(map)
    marker.openPopup()
    markerRef.current = marker

    // Animated "fly" so the map visibly zooms/pans through to the searched place.
    const flyOptions = { duration: 1.6, easeLinearity: 0.25 }
    if (location.bounds) {
      map.flyToBounds(
        [
          [location.bounds.south, location.bounds.west],
          [location.bounds.north, location.bounds.east],
        ],
        { maxZoom: 16, ...flyOptions },
      )
    } else {
      map.flyTo([location.lat, location.lng], 15, flyOptions)
    }

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [map, location])

  return null
}

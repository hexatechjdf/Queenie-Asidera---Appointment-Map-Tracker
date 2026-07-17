import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { UnifiedAppointment } from '@/features/appointments/types/appointment.types'
import type { SearchLocation } from '@/features/search/types'

interface MapAutoFitProps {
  appointments: UnifiedAppointment[]
  searchLocation: SearchLocation | null
}

/**
 * Fits the map to the visible appointment markers (like the legacy
 * zoomToMarkers), but only when no location search is active — so a search
 * controls the view, and clearing the search returns to the appointments.
 */
export function MapAutoFit({ appointments, searchLocation }: MapAutoFitProps) {
  const map = useMap()

  useEffect(() => {
    if (searchLocation) return

    const points: Array<[number, number]> = []
    for (const appointment of appointments) {
      if (appointment.coords) {
        points.push([appointment.coords.lat, appointment.coords.lng])
      }
    }
    if (points.length === 0) return

    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 })
  }, [map, appointments, searchLocation])

  return null
}

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { MAP_MAX_ZOOM } from '@/constants/map.constants'
import type { AppointmentCoords } from '@/features/appointments/types/appointment.types'

interface MapFlyToProps {
  target: AppointmentCoords | null
}

/**
 * Flies the map to a requested location (e.g. clicking an appointment in the
 * View-All popup). Fires whenever `target` changes to a new object, so a fresh
 * coords object should be passed on each request to re-trigger the same location.
 */
export function MapFlyTo({ target }: MapFlyToProps) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], MAP_MAX_ZOOM, { duration: 1.2 })
  }, [map, target])

  return null
}

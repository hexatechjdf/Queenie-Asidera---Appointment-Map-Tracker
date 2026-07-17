import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { createBusyIcon } from '../utils/markerIcon'
import { buildBusyTooltip, TOOLTIP_ACTION_CLASS } from '../utils/markerTooltip'
import { bindHoverPopup } from '../utils/hoverPopup'
import { pseudoBusyPosition } from '../utils/busyPosition'
import { formatDate, formatTime } from '@/utils/date'
import type {
  AppointmentCoords,
  BusyEvent,
} from '@/features/appointments/types/appointment.types'

interface BusyMarkersProps {
  busyEvents: BusyEvent[]
  colorOf: (repId: string) => string
  nameOf: (repId: string) => string
  /** Centroid of loaded appointments; Busy markers scatter near it when set. */
  anchor: AppointmentCoords | null
  onViewAll: (repId: string) => void
}

/**
 * Renders Busy markers (rep color + black border) at a deterministic
 * pseudo-position per event, scattered near the loaded appointments. The position
 * is informational only and stable for the session (keyed by event id). Like an
 * appointment marker, hovering shows an info bubble with a "View All Appointments"
 * button that opens the rep's full schedule.
 */
export function BusyMarkers({
  busyEvents,
  colorOf,
  nameOf,
  anchor,
  onViewAll,
}: BusyMarkersProps) {
  const map = useMap()

  useEffect(() => {
    const layer = L.layerGroup()

    for (const busy of busyEvents) {
      const repName = nameOf(busy.repId)
      const pos = pseudoBusyPosition(busy.id, anchor)
      const marker = L.marker([pos.lat, pos.lng], {
        icon: createBusyIcon(
          colorOf(busy.repId),
          formatDate(busy.startTime),
          busy.isFullDay ? '' : formatTime(busy.startTime),
          repName,
        ),
      })
      // Info bubble shown on hover. Implemented as a popup (not a tooltip) so its
      // "View All Appointments" button reliably receives clicks.
      bindHoverPopup(marker, {
        html: buildBusyTooltip(busy, repName),
        actionClass: TOOLTIP_ACTION_CLASS,
        onAction: () => onViewAll(busy.repId),
      })
      layer.addLayer(marker)
    }

    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, busyEvents, colorOf, nameOf, anchor, onViewAll])

  return null
}

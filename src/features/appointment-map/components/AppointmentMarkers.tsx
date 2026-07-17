import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { createAppointmentIcon } from '../utils/markerIcon'
import {
  buildAppointmentTooltip,
  TOOLTIP_ACTION_CLASS,
} from '../utils/markerTooltip'
import { bindHoverPopup } from '../utils/hoverPopup'
import { computeMarkerPositions } from '../utils/markerPositions'
import { MAP_MAX_ZOOM } from '@/constants/map.constants'
import { formatDate, formatTime } from '@/utils/date'
import type { UnifiedAppointment } from '@/features/appointments/types/appointment.types'

interface AppointmentMarkersProps {
  appointments: UnifiedAppointment[]
  colorOf: (repId: string) => string
  nameOf: (repId: string) => string
  /** When true, markers are grouped into clusters (useful for dense locations). */
  cluster: boolean
  onViewAll: (repId: string) => void
}

/** Cluster options tuned for many same-location appointments. */
const CLUSTER_OPTIONS: L.MarkerClusterGroupOptions = {
  showCoverageOnHover: false,
  chunkedLoading: true,
  spiderfyOnMaxZoom: true,
}

/**
 * Renders appointment markers, either individually (every appointment visible
 * without a click; same-location ones fanned into a small ring) or grouped into
 * clusters when `cluster` is on — which keeps dense locations (100s at one place)
 * usable. Only appointments with resolved coordinates are shown; the layer is
 * rebuilt when inputs change.
 */
export function AppointmentMarkers({
  appointments,
  colorOf,
  nameOf,
  cluster,
  onViewAll,
}: AppointmentMarkersProps) {
  const map = useMap()

  useEffect(() => {
    const positions = computeMarkerPositions(appointments)
    const markers: L.Marker[] = []

    for (const appointment of appointments) {
      const pos = positions.get(appointment.id)
      if (!pos) continue // no resolved coordinates → no marker
      const [lat, lng] = pos

      const repName = nameOf(appointment.repId)
      const marker = L.marker([lat, lng], {
        icon: createAppointmentIcon(
          colorOf(appointment.repId),
          formatDate(appointment.startTime),
          formatTime(appointment.startTime),
          repName,
        ),
      })
      // Single click zooms straight to this marker at full zoom.
      marker.on('click', () => {
        map.flyTo([lat, lng], MAP_MAX_ZOOM, { duration: 1.2 })
      })
      // Info bubble shown on hover. Implemented as a popup (not a tooltip) so its
      // "View All Appointments" button reliably receives clicks.
      bindHoverPopup(marker, {
        html: buildAppointmentTooltip(appointment, repName),
        actionClass: TOOLTIP_ACTION_CLASS,
        onAction: () => onViewAll(appointment.repId),
      })
      markers.push(marker)
    }

    let layer: L.LayerGroup
    if (cluster) {
      const clusterGroup = L.markerClusterGroup(CLUSTER_OPTIONS)
      clusterGroup.addLayers(markers)
      layer = clusterGroup
    } else {
      layer = L.layerGroup(markers)
    }

    map.addLayer(layer)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, appointments, colorOf, nameOf, cluster, onViewAll])

  return null
}

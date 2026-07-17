import 'leaflet/dist/leaflet.css'
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  LayersControl,
} from 'react-leaflet'
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  OSM_TILE,
  SATELLITE_TILE,
} from '@/constants/map.constants'
import { AppointmentMarkers } from './AppointmentMarkers'
import { BusyMarkers } from './BusyMarkers'
import { MapAutoFit } from './MapAutoFit'
import { MapFlyTo } from './MapFlyTo'
import { SearchFocus } from './SearchFocus'
import type {
  AppointmentCoords,
  BusyEvent,
  UnifiedAppointment,
} from '@/features/appointments/types/appointment.types'
import type { SearchLocation } from '@/features/search/types'

interface MapContainerProps {
  appointments: UnifiedAppointment[]
  busyEvents: BusyEvent[]
  busyAnchor: AppointmentCoords | null
  colorOf: (repId: string) => string
  nameOf: (repId: string) => string
  cluster: boolean
  searchLocation: SearchLocation | null
  flyTo: AppointmentCoords | null
  onViewAll: (repId: string) => void
}

/**
 * Full-screen Leaflet map. Renders base tile layers and the appointment marker
 * layer. Per the architecture, the map component only renders — it never fetches
 * or filters data.
 */
export function MapContainer({
  appointments,
  busyEvents,
  busyAnchor,
  colorOf,
  nameOf,
  cluster,
  searchLocation,
  flyTo,
  onViewAll,
}: MapContainerProps) {
  return (
    <LeafletMapContainer
      center={MAP_DEFAULT_CENTER}
      zoom={MAP_DEFAULT_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      className="h-full w-full"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Street View">
          <TileLayer
            url={OSM_TILE.url}
            attribution={OSM_TILE.attribution}
            maxZoom={MAP_MAX_ZOOM}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite View">
          <TileLayer
            url={SATELLITE_TILE.url}
            attribution={SATELLITE_TILE.attribution}
            maxZoom={MAP_MAX_ZOOM}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <AppointmentMarkers
        appointments={appointments}
        colorOf={colorOf}
        nameOf={nameOf}
        cluster={cluster}
        onViewAll={onViewAll}
      />
      <BusyMarkers
        busyEvents={busyEvents}
        colorOf={colorOf}
        nameOf={nameOf}
        anchor={busyAnchor}
        onViewAll={onViewAll}
      />
      <MapAutoFit appointments={appointments} searchLocation={searchLocation} />
      <SearchFocus location={searchLocation} />
      <MapFlyTo target={flyTo} />
    </LeafletMapContainer>
  )
}

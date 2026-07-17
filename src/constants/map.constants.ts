import type { LatLngExpression } from 'leaflet'

export const MAP_DEFAULT_CENTER: LatLngExpression = [20, 0]
export const MAP_DEFAULT_ZOOM = 2
export const MAP_MAX_ZOOM = 19

/**
 * Base tile layers, mirroring the legacy Customer Map: OpenStreetMap street
 * tiles (default) and Esri World Imagery for satellite view.
 */
export const OSM_TILE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
} as const

export const SATELLITE_TILE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri',
} as const

export interface SearchBounds {
  south: number
  west: number
  north: number
  east: number
}

export interface SearchLocation {
  lat: number
  lng: number
  /** Place viewport, when available, for a natural zoom level. */
  bounds: SearchBounds | null
  label: string
}

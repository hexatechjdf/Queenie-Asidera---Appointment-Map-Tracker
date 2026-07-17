import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { TextField } from '@/components/ui/TextField'
import { loadGoogleMaps } from '@/lib/googleMaps'
import type { SearchLocation } from './types'

interface PlacesAutocompleteProps {
  onSelect: (location: SearchLocation | null) => void
}

/**
 * Single location search powered by Google Places Autocomplete (address, city,
 * state, or zip). On selection it reports the chosen place so the map can pan and
 * zoom to it. Best-effort: if the SDK fails to load, the input still works as a
 * plain text field without suggestions.
 */
export function PlacesAutocomplete({ onSelect }: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    let listener: google.maps.MapsEventListener | null = null

    loadGoogleMaps()
      .then((maps) => {
        if (!active || !inputRef.current) return

        const autocomplete = new maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          fields: ['geometry', 'name', 'formatted_address'],
        })

        listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const location = place.geometry?.location
          if (!location) return

          const viewport = place.geometry?.viewport
          onSelect({
            lat: location.lat(),
            lng: location.lng(),
            bounds: viewport
              ? {
                  south: viewport.getSouthWest().lat(),
                  west: viewport.getSouthWest().lng(),
                  north: viewport.getNorthEast().lat(),
                  east: viewport.getNorthEast().lng(),
                }
              : null,
            label: place.name ?? place.formatted_address ?? '',
          })
        })
      })
      .catch(() => {
        // SDK unavailable — input remains usable without autocomplete.
      })

    return () => {
      active = false
      listener?.remove()
    }
  }, [onSelect])

  return (
    <TextField
      ref={inputRef}
      icon={<Search className="h-4 w-4" />}
      placeholder="Search for a place..."
      aria-label="Search location"
      onChange={(event) => {
        // Clearing the input resets the search (removes pin, returns to appointments).
        if (event.target.value.trim() === '') onSelect(null)
      }}
    />
  )
}

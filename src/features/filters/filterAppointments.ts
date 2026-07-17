import type { AppointmentFilters } from './types'

/** Minimal shape the filter needs — shared by appointments and busy events. */
interface FilterableEvent {
  repId: string
  startTime: string
}

/**
 * The appointment's own local date (`yyyy-MM-dd`) taken directly from the ISO
 * string's offset — the same wall-clock date that is displayed. This keeps
 * filtering consistent with display regardless of the viewer's timezone.
 */
function dateKey(iso: string): string {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

/**
 * Pure, in-memory filtering by rep and date. No API calls — operates on the
 * loaded dataset only:
 *   - reps: keep items whose rep is selected (empty = all)
 *   - date + "after": on or after the selected date
 *   - date + "equal": on the selected date only
 *
 * Generic over any item carrying `repId` + `startTime`, so it is shared by both
 * appointments and busy events.
 */
export function filterAppointments<T extends FilterableEvent>(
  items: T[],
  filters: AppointmentFilters,
): T[] {
  const repSet = filters.repIds.length ? new Set(filters.repIds) : null

  return items.filter((item) => {
    if (repSet && !repSet.has(item.repId)) return false

    if (filters.date) {
      const key = dateKey(item.startTime)
      if (!key) return false
      if (filters.dateMode === 'equal' ? key !== filters.date : key < filters.date) {
        return false
      }
    }

    return true
  })
}

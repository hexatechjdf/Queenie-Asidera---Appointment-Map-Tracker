import type { GhlClient } from '@/services/api/ghlClient'

/** Raw GHL calendar event (verified shape). */
export interface AppointmentEvent {
  id: string
  contactId?: string
  assignedUserId?: string
  startTime?: string
  endTime?: string
  appointmentStatus?: string
  /** API also returns a misspelled duplicate; kept as a fallback. */
  appoinmentStatus?: string
  selectedTimezone?: string
  title?: string
  deleted?: boolean
}

interface EventsResponse {
  events?: AppointmentEvent[]
}

/** TEMP: dump the first raw event to inspect for calendarId/groupId. */
const DEBUG_RAW_EVENTS = true

/**
 * Fetch a single rep's calendar events within a time window (epoch ms). The GHL
 * calendar events endpoint requires one of userId/calendarId/groupId, so
 * appointments are loaded per assigned user. Deleted events are filtered out.
 */
export async function fetchUserAppointments(
  client: GhlClient,
  locationId: string,
  userId: string,
  startMs: number,
  endMs: number,
): Promise<AppointmentEvent[]> {
  const params = new URLSearchParams({
    locationId,
    userId,
    startTime: String(startMs),
    endTime: String(endMs),
  })

  const data = await client.get<EventsResponse>(
    `calendars/events?${params.toString()}`,
  )

  // TEMP: raw-response probe to check for a shared calendarId/groupId across reps.
  // Remove once the groupId/calendarId question is answered.
  if (DEBUG_RAW_EVENTS) {
    const events = data.events ?? []
    const first = events[0] as unknown as Record<string, unknown> | undefined
    console.log(`[calendar-raw] events userId=${userId}:`, {
      count: events.length,
      keys: first ? Object.keys(first) : [],
      calendarId: first?.calendarId,
      groupId: first?.groupId,
      firstEvent: first,
    })
  }

  return (data.events ?? []).filter((event) => !event.deleted)
}

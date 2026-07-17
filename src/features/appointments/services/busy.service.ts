import type { GhlClient } from '@/services/api/ghlClient'

/**
 * Raw GHL blocked-slot (verified shape from `GET /calendars/blocked-slots`).
 * Busy events synced from an external calendar arrive here — NOT via
 * `calendars/events` — with `assignedUserId` identifying the representative and
 * a genericized `title` of "Busy". Third-party details (including location) are
 * commonly stripped, so `address` is often empty.
 */
export interface BlockedSlotEvent {
  id: string
  title?: string
  assignedUserId?: string
  startTime?: string
  endTime?: string
  address?: string
  isFullDay?: boolean
  deleted?: boolean
}

interface BlockedSlotsResponse {
  events?: BlockedSlotEvent[]
}

/** TEMP: dump the first raw blocked slot to inspect for calendarId/groupId. */
const DEBUG_RAW_SLOTS = true

/**
 * Fetch a single rep's Busy / blocked slots within a time window (epoch ms).
 * Mirrors the calendar-events request contract (one of userId/calendarId/groupId
 * is required, so we query per assigned user). Deleted slots are filtered out.
 */
export async function fetchUserBlockedSlots(
  client: GhlClient,
  locationId: string,
  userId: string,
  startMs: number,
  endMs: number,
): Promise<BlockedSlotEvent[]> {
  const params = new URLSearchParams({
    locationId,
    userId,
    startTime: String(startMs),
    endTime: String(endMs),
  })

  const data = await client.get<BlockedSlotsResponse>(
    `calendars/blocked-slots?${params.toString()}`,
  )

  // TEMP: raw-response probe to check for a shared calendarId/groupId across reps.
  // Remove once the groupId/calendarId question is answered.
  if (DEBUG_RAW_SLOTS) {
    const slots = data.events ?? []
    const first = slots[0] as unknown as Record<string, unknown> | undefined
    console.log(`[blocked-raw] slots userId=${userId}:`, {
      count: slots.length,
      keys: first ? Object.keys(first) : [],
      calendarId: first?.calendarId,
      groupId: first?.groupId,
      firstSlot: first,
    })
  }

  return (data.events ?? []).filter((event) => !event.deleted)
}

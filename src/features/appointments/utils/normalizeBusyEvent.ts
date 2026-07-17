import type { BlockedSlotEvent } from '../services/busy.service'
import type { BusyEvent } from '../types/appointment.types'

/**
 * Normalize a raw GHL blocked slot into the unified Busy model. Busy events carry
 * no usable location; map placement is a deterministic pseudo-position resolved at
 * render time (see `pseudoBusyPosition`).
 */
export function normalizeBusyEvent(raw: BlockedSlotEvent): BusyEvent {
  return {
    id: raw.id,
    repId: raw.assignedUserId ?? '',
    title: raw.title?.trim() || 'Busy',
    startTime: raw.startTime ?? '',
    endTime: raw.endTime ?? '',
    address: raw.address?.trim() ?? '',
    isFullDay: raw.isFullDay ?? false,
  }
}

import type { AppointmentEvent } from '../services/calendar.service'
import type { AppointmentContact } from '../services/contact.service'
import type { UnifiedAppointment } from '../types/appointment.types'

function join(parts: Array<string | undefined>, separator: string): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(separator)
}

/**
 * Merge a calendar event with its contact into a single record. Coordinates are
 * resolved later by geocoding; they start as null.
 */
export function normalizeAppointment(
  event: AppointmentEvent,
  contact: AppointmentContact | null,
): UnifiedAppointment {
  const contactName = contact
    ? join([contact.firstName, contact.lastName], ' ')
    : ''

  return {
    id: event.id,
    contactId: event.contactId ?? '',
    repId: event.assignedUserId ?? '',
    contactName: contactName || 'Unknown',
    companyName: contact?.companyName ?? '',
    status: event.appointmentStatus ?? event.appoinmentStatus ?? '',
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    timezone: event.selectedTimezone ?? '',
    address: contact?.address1 ?? '',
    city: contact?.city ?? '',
    state: contact?.state ?? '',
    postalCode: contact?.postalCode ?? '',
    country: contact?.country ?? '',
    fullAddress: contact
      ? join(
          [
            contact.address1,
            contact.city,
            contact.state,
            contact.postalCode,
            contact.country,
          ],
          ', ',
        )
      : '',
    coords: null,
  }
}

import type { AppointmentEvent } from '../services/calendar.service'
import type { AppointmentContact } from '../services/contact.service'
import {
  DEBUG_FIELDS,
  KEYS,
  readCustomFieldValues,
  type CustomFieldMap,
} from '../services/customFields.service'
import type {
  AppointmentCoords,
  UnifiedAppointment,
} from '../types/appointment.types'

function join(parts: Array<string | undefined>, separator: string): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(separator)
}

/** Parse Latitude/Longitude custom-field strings into coordinates, or null. */
function coordsFromCustomFields(
  lat: string | undefined,
  lng: string | undefined,
): AppointmentCoords | null {
  if (!lat || !lng) return null
  const latNum = Number(lat)
  const lngNum = Number(lng)
  return Number.isFinite(latNum) && Number.isFinite(lngNum)
    ? { lat: latNum, lng: lngNum }
    : null
}

/**
 * Merge a calendar event with its contact into a single record. Contact custom
 * fields (Contact Type, Inspection Plan, Type of Service, Vendor Name,
 * Latitude/Longitude) are read via the resolved field map. When the contact
 * already carries Latitude/Longitude custom fields, `coords` is populated here;
 * otherwise it starts null and is resolved later by the existing geocoding flow.
 */
export function normalizeAppointment(
  event: AppointmentEvent,
  contact: AppointmentContact | null,
  fieldMap: CustomFieldMap = {},
): UnifiedAppointment {
  const contactName = contact
    ? join([contact.firstName, contact.lastName], ' ')
    : ''

  const custom = readCustomFieldValues(contact?.customFields ?? [], fieldMap)

  if (DEBUG_FIELDS && contact?.customFields?.length) {
    // (b) For each contact that has custom fields: the raw ids present vs. what
    // we extracted. If a customer contact shows a Vendor Name value in the
    // legacy tool but `extracted` is empty here, its raw ids won't include the
    // resolved Vendor Name id (id/name mismatch in getFields).
    console.log('[fields] contact', contactName || 'Unknown', {
      rawFieldIds: contact.customFields.map((f) => f.id),
      extracted: custom,
    })
  }

  return {
    id: event.id,
    contactId: event.contactId ?? '',
    repId: event.assignedUserId ?? '',
    contactName: contactName || 'Unknown',
    companyName: contact?.companyName ?? '',
    contactType: custom[KEYS.CONTACT_TYPE] || contact?.type || '',
    status: event.appointmentStatus ?? event.appoinmentStatus ?? '',
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    timezone: event.selectedTimezone ?? '',
    address: contact?.address1 ?? '',
    city: contact?.city ?? '',
    state: contact?.state ?? '',
    postalCode: contact?.postalCode ?? '',
    country: contact?.country ?? '',
    inspectionPlan: custom[KEYS.INSPECTION_PLAN] ?? '',
    typeOfService: custom[KEYS.TYPE_SERVICE] ?? '',
    vendorName: custom[KEYS.VENDOR_NAME] ?? '',
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
    coords: coordsFromCustomFields(custom[KEYS.LAT], custom[KEYS.LNG]),
  }
}

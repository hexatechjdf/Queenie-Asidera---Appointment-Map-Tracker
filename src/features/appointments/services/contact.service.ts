import type { GhlClient } from '@/services/api/ghlClient'

interface RawContact {
  id?: string
  firstName?: string
  lastName?: string
  companyName?: string
  address1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface ContactResponse {
  contact?: RawContact
}

export interface AppointmentContact {
  id: string
  firstName: string
  lastName: string
  companyName: string
  address1: string
  city: string
  state: string
  postalCode: string
  country: string
}

function normalizeContact(raw: RawContact | undefined): AppointmentContact | null {
  if (!raw?.id) return null

  return {
    id: raw.id,
    firstName: raw.firstName ?? '',
    lastName: raw.lastName ?? '',
    companyName: raw.companyName ?? '',
    address1: raw.address1 ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    postalCode: raw.postalCode ?? '',
    country: raw.country ?? '',
  }
}

const contactCache = new Map<string, Promise<AppointmentContact | null>>()

/**
 * Fetch and cache a contact by id. Concurrent and repeat requests for the same
 * contact reuse the in-flight/resolved promise, so a contact is never fetched
 * twice. Failed lookups are evicted so they can be retried.
 */
export function fetchContact(
  client: GhlClient,
  contactId: string,
): Promise<AppointmentContact | null> {
  const cached = contactCache.get(contactId)
  if (cached) return cached

  const request = client
    .get<ContactResponse>(`contacts/${contactId}`)
    .then((data) => normalizeContact(data.contact))
    .catch(() => {
      contactCache.delete(contactId)
      return null
    })

  contactCache.set(contactId, request)
  return request
}

import type { GhlClient } from '@/services/api/ghlClient'
import type { RawCustomFieldValue } from './customFields.service'

/**
 * Raw contact, tolerant of both endpoints we read from: the single `contacts/{id}`
 * GET and the bulk `contacts/search/2`. Company/address alternates mirror the
 * reference's `getCompany()` / `getAddress()` fallbacks.
 */
export interface RawContact {
  id?: string
  firstName?: string
  lastName?: string
  companyName?: string
  businessName?: string
  company_name?: string
  address1?: string
  address?: string
  address_1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  type?: string
  customFields?: RawCustomFieldValue[]
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
  type: string
  customFields: RawCustomFieldValue[]
}

/** Mirrors the reference `getCompany()`. */
function getCompany(raw: RawContact): string {
  return raw.companyName ?? raw.businessName ?? raw.company_name ?? ''
}

/** Mirrors the reference `getAddress()`. */
function getAddress(raw: RawContact): string {
  return raw.address1 ?? raw.address_1 ?? raw.address ?? ''
}

/**
 * Normalize a raw contact (from either the single GET or bulk search) into the
 * shape the app consumes. Shared so both sources produce identical records.
 */
export function normalizeRawContact(
  raw: RawContact | undefined,
): AppointmentContact | null {
  if (!raw?.id) return null

  return {
    id: raw.id,
    firstName: raw.firstName ?? '',
    lastName: raw.lastName ?? '',
    companyName: getCompany(raw),
    address1: getAddress(raw),
    city: raw.city ?? '',
    state: raw.state ?? '',
    postalCode: raw.postalCode ?? '',
    country: raw.country ?? '',
    type: raw.type ?? '',
    customFields: raw.customFields ?? [],
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
    .then((data) => normalizeRawContact(data.contact))
    .catch(() => {
      contactCache.delete(contactId)
      return null
    })

  contactCache.set(contactId, request)
  return request
}

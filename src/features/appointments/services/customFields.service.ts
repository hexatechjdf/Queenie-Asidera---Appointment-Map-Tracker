import type { GhlClient } from '@/services/api/ghlClient'

/**
 * Custom-field resolution, adapted from the lead's reference implementation
 * (`KEYS`, `configs`, `fetchCustomField`, `getFields`, `findLatLng`).
 *
 * The reference hardcodes field ids per location; per project rules we never
 * hardcode values, so ids are resolved dynamically by field name via the GHL
 * `customFields/search` endpoint. Reading is strictly read-only — unlike the
 * reference we never write coordinates back to GHL (see meeting-notes §7).
 */

/** Custom-field display names, matching the reference `KEYS`. */
export const KEYS = {
  LAT: 'Latitude',
  LNG: 'Longitude',
  INSPECTION_PLAN: 'Inspection Plan',
  TYPE_SERVICE: 'Type of Service',
  VENDOR_NAME: 'Vendor Name',
  CONTACT_TYPE: 'Contact Type',
} as const

/** Field names resolved on load, mirroring the reference `configs`. */
const CUSTOM_FIELD_NAMES: string[] = [
  KEYS.INSPECTION_PLAN,
  KEYS.CONTACT_TYPE,
  KEYS.TYPE_SERVICE,
  KEYS.VENDOR_NAME,
  KEYS.LAT,
  KEYS.LNG,
]

/** Field-name → field-id map for a location (empty when none resolve). */
export type CustomFieldMap = Record<string, string>

/**
 * A single custom-field value on a contact. Shape differs by endpoint: the
 * single-contact GET returns `value`, the bulk `contacts/search/2` returns
 * `fieldValueString`. Both are read so the same logic works either way.
 */
export interface RawCustomFieldValue {
  id?: string
  value?: unknown
  fieldValueString?: string
}

interface CustomFieldDefinition {
  id?: string
  _id?: string
  name?: string
}

interface CustomFieldsSearchResponse {
  customFields?: CustomFieldDefinition[]
}

/**
 * TEMP diagnostic switch. Set to `false` (or delete the guarded blocks) once the
 * custom-field mapping is confirmed working against live data. Logs (1) the
 * resolved field-name → id map, and (2) each contact that carries custom fields.
 */
export const DEBUG_FIELDS = true

/**
 * Resolve one custom field id by exact (case-insensitive) name match, mirroring
 * the reference `fetchCustomField`. Returns null when the field does not exist.
 */
async function fetchCustomField(
  client: GhlClient,
  locationId: string,
  query: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    parentId: '',
    skip: '0',
    limit: '10',
    documentType: 'field',
    model: 'all',
    query,
    includeStandards: 'true',
  })

  const data = await client.get<CustomFieldsSearchResponse>(
    `locations/${locationId}/customFields/search?${params.toString()}`,
  )
  const field = data.customFields?.find(
    (f) => f.name?.trim().toLowerCase() === query.toLowerCase(),
  )
  return field ? field.id ?? field._id ?? null : null
}

const fieldMapCache = new Map<string, Promise<CustomFieldMap>>()

/**
 * Resolve the location's custom-field ids once (cached), mirroring the reference
 * `getFields`. Any individual lookup that fails is skipped so a single missing
 * field never blocks the rest; a total failure resolves to an empty map so the
 * schedule still loads.
 */
export function getCustomFieldMap(
  client: GhlClient,
  locationId: string,
): Promise<CustomFieldMap> {
  const cached = fieldMapCache.get(locationId)
  if (cached) return cached

  const request = (async () => {
    const entries = await Promise.all(
      CUSTOM_FIELD_NAMES.map(
        async (name) =>
          [name, await fetchCustomField(client, locationId, name).catch(() => null)] as const,
      ),
    )
    const map: CustomFieldMap = {}
    for (const [name, id] of entries) if (id) map[name] = id
    if (DEBUG_FIELDS) {
      // (a) Did getFields resolve every field id? Any KEY printed as
      // "(unresolved)" means GHL has no custom field with that exact name.
      console.log('[fields] resolved field map:', map, {
        unresolved: CUSTOM_FIELD_NAMES.filter((name) => !map[name]),
      })
    }
    return map
  })().catch((): CustomFieldMap => ({}))

  fieldMapCache.set(locationId, request)
  return request
}

/** Read a custom-field value across endpoint shapes (`fieldValueString` | `value`). */
function fieldValue(field: RawCustomFieldValue): string {
  const value = field.fieldValueString ?? field.value
  return value == null ? '' : String(value)
}

/**
 * Map a contact's raw custom fields to `{ fieldName: value }`. This is the
 * reference `findLatLng`, generalized to every configured field: it iterates the
 * name → id map directly (never inverts it), so if two names ever resolve to the
 * same field id, both receive the value — matching the reference exactly and
 * avoiding any drop-out (e.g. Vendor Name vs Type of Service). Empty values are
 * omitted. Reads `fieldValueString` (bulk search) or `value` (single-contact GET).
 */
export function readCustomFieldValues(
  raw: RawCustomFieldValue[],
  fieldMap: CustomFieldMap,
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of raw) {
    for (const [name, fieldId] of Object.entries(fieldMap)) {
      if (field.id === fieldId) {
        const value = fieldValue(field)
        if (value !== '') values[name] = value
      }
    }
  }
  return values
}

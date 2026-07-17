import axios from 'axios'
import { loadRuntimeConfig } from '@/services/config/runtimeConfig'
import type { LocationRepConfig } from '../types/rep.types'

/**
 * Rep configuration source: a Google Apps Script web app that exposes the sheet
 * as JSON:
 *   {
 *     locations: { [locationId]: { users: string[] } },  // allowed reps
 *     users:     { [userId]: string }                    // marker color
 *   }
 *
 * The endpoint URL comes from the runtime config layer (parent-provided
 * `gsheet_url`, falling back to the `.env` value) and needs no API key or sheet
 * id. Any failure resolves to null so callers fall back to showing every GHL
 * user. The response is transformed into the shared LocationRepConfig shape, so
 * downstream logic (allowed users + colors) is unchanged.
 */

interface RepConfigResponse {
  locations?: Record<string, { users?: string[] }>
  users?: Record<string, string>
}

function toLocationConfigs(payload: RepConfigResponse): LocationRepConfig[] {
  const locations = payload.locations ?? {}
  const colors = payload.users ?? {}

  return Object.entries(locations).map(([locationId, entry]) => ({
    locationId,
    reps: (entry?.users ?? []).map((userId) => ({
      userId,
      color: colors[userId],
    })),
  }))
}

export async function fetchRepSheet(): Promise<LocationRepConfig[] | null> {
  const { repConfigUrl } = await loadRuntimeConfig()
  if (!repConfigUrl) return null

  try {
    const { data } = await axios.get<RepConfigResponse>(repConfigUrl)
    return toLocationConfigs(data)
  } catch {
    // Fail closed: callers fall back to showing every GHL user.
    return null
  }
}

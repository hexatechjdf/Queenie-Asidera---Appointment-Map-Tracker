import type { GhlClient } from '@/services/api/ghlClient'
import { fetchUsers, type GhlUser } from './user.service'
import { fetchRepSheet } from './google-sheet.service'
import { resolveRepColor } from '../utils/repColor'
import type { LocationRepConfig, Rep } from '../types/rep.types'

function buildConfiguredReps(config: LocationRepConfig, users: GhlUser[]): Rep[] {
  const byId = new Map(users.map((user) => [user.id, user]))
  const byName = new Map(users.map((user) => [user.name.toLowerCase(), user]))

  const reps: Rep[] = []
  for (const entry of config.reps) {
    const matched =
      (entry.userId ? byId.get(entry.userId) : undefined) ??
      (entry.name ? byName.get(entry.name.toLowerCase()) : undefined)

    const id = matched?.id ?? entry.userId ?? entry.name
    if (!id) continue

    reps.push({
      id,
      name: matched?.name ?? entry.name ?? 'Unknown',
      email: matched?.email ?? '',
      color: resolveRepColor(id, entry.color),
    })
  }
  return reps
}

function buildAllReps(users: GhlUser[]): Rep[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    color: resolveRepColor(user.id),
  }))
}

/**
 * Resolve the sales representatives to display, applying the Google Sheet rules:
 *   - If the sheet configures this location, show only the configured reps.
 *   - Otherwise show every GHL user.
 * Colors follow the sheet → cache → generated priority.
 */
export async function resolveReps(
  client: GhlClient,
  locationId: string,
): Promise<Rep[]> {
  const [users, sheet] = await Promise.all([
    fetchUsers(client, locationId),
    fetchRepSheet(),
  ])

  const config =
    sheet?.find((entry) => entry.locationId === locationId && entry.reps.length) ??
    null

  return config ? buildConfiguredReps(config, users) : buildAllReps(users)
}

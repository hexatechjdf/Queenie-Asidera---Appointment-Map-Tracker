import type { GhlClient } from '@/services/api/ghlClient'

interface RawGhlUser {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  deleted?: boolean
}

interface UsersResponse {
  users?: RawGhlUser[]
}

export interface GhlUser {
  id: string
  name: string
  email: string
}

function normalizeUser(raw: RawGhlUser): GhlUser | null {
  if (!raw.id) return null

  const fullName = [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim()
  const name = raw.name?.trim() || fullName || raw.email || 'Unknown'

  return { id: raw.id, name, email: raw.email ?? '' }
}

export async function fetchUsers(
  client: GhlClient,
  locationId: string,
): Promise<GhlUser[]> {
  const data = await client.get<UsersResponse>(`users/?locationId=${locationId}`)
  return (data.users ?? [])
    .filter((user) => !user.deleted)
    .map(normalizeUser)
    .filter((user): user is GhlUser => user !== null)
}

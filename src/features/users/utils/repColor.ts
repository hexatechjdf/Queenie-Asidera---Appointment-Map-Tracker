const STORAGE_KEY = 'appointment-map:rep-colors'

type ColorCache = Record<string, string>

function loadCache(): ColorCache {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ColorCache) : {}
  } catch {
    return {}
  }
}

function saveCache(cache: ColorCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage failures (e.g. private mode / quota).
  }
}

/**
 * Deterministic color derived from the rep id, so a rep keeps the same hue even
 * before it is cached and across reloads.
 */
function generateColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return `hsl(${hash % 360}, 65%, 45%)`
}

/**
 * Resolve a rep's marker color by priority (per project rules):
 *   1. Google Sheet color — always wins, never cached.
 *   2. Cached localStorage color.
 *   3. Generated color, then persisted to localStorage.
 */
export function resolveRepColor(repId: string, sheetColor?: string): string {
  const trimmedSheetColor = sheetColor?.trim()
  if (trimmedSheetColor) return trimmedSheetColor

  const cache = loadCache()
  if (cache[repId]) return cache[repId]

  const color = generateColor(repId)
  cache[repId] = color
  saveCache(cache)
  return color
}

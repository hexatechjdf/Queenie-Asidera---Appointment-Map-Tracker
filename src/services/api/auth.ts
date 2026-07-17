import type { GhlAuth } from '@/types/auth.types'

/**
 * GHL authentication resolution.
 *
 * Local development uses a hardcoded token from the environment. Production runs
 * embedded inside a GHL Custom Menu iframe and obtains the token via a
 * postMessage handshake with the parent window (the proven legacy mechanism).
 */

/**
 * Message protocol shared with the parent white-label script:
 *   iframe → parent: { source: 'opportunity-iframe', type: 'getToken' }
 *   parent → iframe: { type: 'tokenResponse', token, locationId }
 */
const TOKEN_REQUEST = { source: 'opportunity-iframe', type: 'getToken' } as const
const TOKEN_RESPONSE_TYPE = 'tokenResponse'
const HANDSHAKE_TIMEOUT_MS = 10_000

interface TokenMessage {
  type: typeof TOKEN_RESPONSE_TYPE
  token: string
  locationId?: string
}

function isTokenMessage(data: unknown): data is TokenMessage {
  if (typeof data !== 'object' || data === null) return false
  const message = data as Record<string, unknown>
  return (
    message.type === TOKEN_RESPONSE_TYPE && typeof message.token === 'string'
  )
}

/**
 * Ask the parent window for a GHL token and location id. Resolves when the
 * parent replies, rejects if not embedded or the reply never arrives.
 */
export function requestGhlToken(timeoutMs = HANDSHAKE_TIMEOUT_MS): Promise<GhlAuth> {
  return new Promise((resolve, reject) => {
    if (window.parent === window) {
      reject(new Error('Not embedded in a parent window'))
      return
    }

    const timer = setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      reject(new Error('Timed out waiting for the GHL token'))
    }, timeoutMs)

    function handleMessage({ data }: MessageEvent) {
      if (!isTokenMessage(data)) return
      clearTimeout(timer)
      window.removeEventListener('message', handleMessage)
      resolve({ token: data.token, locationId: data.locationId ?? '' })
    }

    window.addEventListener('message', handleMessage)
    window.parent.postMessage(TOKEN_REQUEST, '*')
  })
}

/**
 * Resolve auth for the current environment.
 *
 * Controlled by `VITE_PRODUCTION`:
 *   - `true`  → always request the token from the parent window (GHL iframe);
 *               the hardcoded dev token/location are never used.
 *   - unset/false → use the hardcoded dev token/location when present (local
 *               development), falling back to the parent handshake otherwise.
 */
export function resolveGhlAuth(): Promise<GhlAuth> {
  const isProduction = import.meta.env.VITE_PRODUCTION === 'true'
  const devToken = import.meta.env.VITE_GHL_DEV_TOKEN
  const devLocationId = import.meta.env.VITE_GHL_LOCATION_ID

  if (!isProduction && devToken) {
    return Promise.resolve({ token: devToken, locationId: devLocationId ?? '' })
  }

  return requestGhlToken()
}

/**
 * Runtime configuration layer.
 *
 * When embedded in the GHL parent window, the app can receive per-deployment
 * overrides (Google Sheet URL + Google Maps key) via a postMessage handshake,
 * independent of the existing auth (`getToken`) handshake. Everything falls back
 * to the build-time `.env` values, so local development and any non-embedded
 * context behave exactly as before.
 *
 * Message protocol:
 *   iframe → parent: { source: 'opportunity-iframe', type: 'map_config' }
 *   parent → iframe: { type: 'map_config_data', data: { gcm_key, gsheet_url } }
 *
 * Resolution rules:
 *   - gsheet_url (non-empty) overrides VITE_REP_CONFIG_URL, else the .env value.
 *   - gcm_key (non-empty) is exchanged at `/enc-key?key=<gcm_key>` for the actual
 *     Google Maps key (read as text); on any failure/empty it falls back to
 *     VITE_GOOGLE_MAPS_API_KEY.
 */

const CONFIG_REQUEST = {
  source: 'opportunity-iframe',
  type: 'map_config',
} as const
const CONFIG_RESPONSE_TYPE = 'map_config_data'
const HANDSHAKE_TIMEOUT_MS = 10_000

/** Default rep-config endpoint used when neither the parent nor `.env` sets one. */
const DEFAULT_REP_CONFIG_URL =
  'https://script.google.com/macros/s/AKfycbxbGUKtCUVr_0ofDFhOI55oRQ0uvLo1Ir89kxhd2EGgGfXT3g78Z6z67WpeTFBkitIlMQ/exec'

/** Payload sent by the parent inside the `map_config_data` message. */
interface MapConfigData {
  gcm_key?: string
  gsheet_url?: string
}

interface MapConfigMessage {
  type: typeof CONFIG_RESPONSE_TYPE
  data?: MapConfigData
}

/** Effective, resolved configuration consumed by the app. */
export interface RuntimeConfig {
  /** Google Apps Script / Sheet endpoint for rep configuration. */
  repConfigUrl: string
  /** Google Maps JavaScript API key (may be empty if none is configured). */
  googleMapsKey: string
}

function isMapConfigMessage(data: unknown): data is MapConfigMessage {
  if (typeof data !== 'object' || data === null) return false
  return (data as Record<string, unknown>).type === CONFIG_RESPONSE_TYPE
}

/**
 * Ask the parent window for the runtime map config. Resolves with the parent's
 * data, rejects if not embedded or the reply never arrives (callers treat any
 * rejection as "use .env fallbacks").
 */
function requestMapConfig(
  timeoutMs = HANDSHAKE_TIMEOUT_MS,
): Promise<MapConfigData> {
  return new Promise((resolve, reject) => {
    if (window.parent === window) {
      console.warn('[runtime-config] not embedded in a parent window; using .env fallbacks')
      reject(new Error('Not embedded in a parent window'))
      return
    }

    const timer = setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      console.warn('[runtime-config] timed out waiting for map_config_data; using .env fallbacks')
      reject(new Error('Timed out waiting for map config'))
    }, timeoutMs)

    function handleMessage({ data }: MessageEvent) {
      if (!isMapConfigMessage(data)) return
      clearTimeout(timer)
      window.removeEventListener('message', handleMessage)
      console.log('[runtime-config] received map_config_data:', data.data)
      resolve(data.data ?? {})
    }

    window.addEventListener('message', handleMessage)
    console.log('[runtime-config] posting map_config request to parent:', CONFIG_REQUEST)
    window.parent.postMessage(CONFIG_REQUEST, '*')
  })
}

function resolveRepConfigUrl(gsheetUrl?: string): string {
  const fromParent = gsheetUrl?.trim()
  if (fromParent) return fromParent
  return import.meta.env.VITE_REP_CONFIG_URL ?? DEFAULT_REP_CONFIG_URL
}

/**
 * Exchange the parent-provided key handle for the real Google Maps key via
 * `/enc-key`. The response is read as text for now (shape to be confirmed in the
 * browser Network tab); any failure or empty result falls back to `.env`.
 */
async function resolveGoogleMapsKey(gcmKey?: string): Promise<string> {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
  const handle = gcmKey?.trim()
  if (!handle) {
    console.log('[runtime-config] no gcm_key from parent; using VITE_GOOGLE_MAPS_API_KEY')
    return envKey
  }

  const url = `/enc-key?key=${encodeURIComponent(handle)}`
  console.log('[runtime-config] calling /enc-key:', url)
  try {
    const response = await fetch(url)
    console.log(
      `[runtime-config] /enc-key response: ${response.status} ${response.statusText}`,
      `content-type=${response.headers.get('content-type') ?? 'n/a'}`,
    )
    if (!response.ok) {
      console.warn('[runtime-config] /enc-key not OK; using VITE_GOOGLE_MAPS_API_KEY')
      return envKey
    }
    const text = (await response.text()).trim()
    console.log('[runtime-config] /enc-key body (text):', JSON.stringify(text))
    if (!text) {
      console.warn('[runtime-config] /enc-key body empty; using VITE_GOOGLE_MAPS_API_KEY')
      return envKey
    }
    return text
  } catch (error) {
    console.error('[runtime-config] /enc-key fetch failed; using VITE_GOOGLE_MAPS_API_KEY', error)
    return envKey
  }
}

async function resolve(): Promise<RuntimeConfig> {
  const parent = await requestMapConfig().catch(() => null)
  const config: RuntimeConfig = {
    repConfigUrl: resolveRepConfigUrl(parent?.gsheet_url),
    googleMapsKey: await resolveGoogleMapsKey(parent?.gcm_key),
  }
  console.log('[runtime-config] resolved config:', {
    repConfigUrl: config.repConfigUrl,
    googleMapsKey: config.googleMapsKey ? `${config.googleMapsKey.slice(0, 6)}…(${config.googleMapsKey.length} chars)` : '(empty)',
  })
  return config
}

let configPromise: Promise<RuntimeConfig> | null = null

/**
 * Resolve the runtime configuration once and cache it for the session. The parent
 * handshake fires a single time; subsequent callers share the same result.
 */
export function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (!configPromise) configPromise = resolve()
  return configPromise
}

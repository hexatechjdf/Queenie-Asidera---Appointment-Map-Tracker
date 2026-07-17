/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GHL_API_BASE: string
  readonly VITE_GHL_DEV_TOKEN: string
  readonly VITE_GHL_LOCATION_ID: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_REP_CONFIG_URL?: string
  readonly VITE_BUSINESS_TIMEZONE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

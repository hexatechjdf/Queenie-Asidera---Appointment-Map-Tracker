/**
 * GoHighLevel API constants. The base URL is sourced from the environment so it
 * is never hardcoded, with the public LeadConnector endpoint as a safe default.
 * The version string is the GHL API contract version, not a secret.
 */
export const GHL_API_BASE =
  import.meta.env.VITE_GHL_API_BASE ?? 'https://services.leadconnectorhq.com/'

export const GHL_API_VERSION = '2021-07-28'

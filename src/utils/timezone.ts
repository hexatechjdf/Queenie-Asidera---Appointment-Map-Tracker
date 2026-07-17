/** Business timezone used for display when none is configured via env. */
const DEFAULT_BUSINESS_TIME_ZONE = 'America/Chicago'

/**
 * The business/display IANA timezone (e.g. "America/Chicago"). Single source of
 * truth for formatting all appointment and busy-event times, so they are shown in
 * the business's zone — NOT the viewer's browser zone and NOT the raw offset baked
 * into each API timestamp. Overridable via `VITE_BUSINESS_TIMEZONE` so it can
 * follow the location later without a code change.
 */
export function getBusinessTimeZone(): string {
  return import.meta.env.VITE_BUSINESS_TIMEZONE ?? DEFAULT_BUSINESS_TIME_ZONE
}

/**
 * Title-case a string (lowercase everything, capitalize the first letter of each
 * word). Matches the reference implementation's `toTitleCase`, used for display
 * of contact name, company, type, city, and state in the marker tooltip.
 */
export function toTitleCase(value: string): string {
  return value ? value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : ''
}

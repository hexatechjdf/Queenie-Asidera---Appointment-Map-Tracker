# Lead Developer Decisions (Final)

This document contains implementation decisions clarified by the lead developer during meetings. These decisions take precedence over the legacy HTML whenever there is a conflict.

---

## 1. UI Direction

- Reuse the existing customer-map implementation and keep as much of the existing code and behavior as possible.
- This is NOT a complete redesign.
- Remove only the controls that the lead explicitly requested to remove.
- Preserve the overall layout, styling, spacing, and user experience unless instructed otherwise.

---

## 2. Location Search

Replace the legacy location filters:

- City
- State
- ZIP Code
- Search by Address button

with a single Google-powered search input.

The input should accept:

- Full address
- City
- State
- ZIP Code

Google Places Autocomplete should handle all search types.

---

## 3. Date Filter Behavior

The meeting introduced an additional filter that does not exist in the legacy UI.

A comparison selector must be present for date filtering.

Options:

- After (default)
- Equal

Behavior:

- Default selection: After
- If "After" is selected, show appointments on or after the selected date.
- If "Equal" is selected, show appointments only on the selected date.

This requirement comes directly from the meeting and overrides the legacy HTML.

---

## 4. Sales Representative Filter

Keep the Sales Representative dropdown.

Its options will come from the Google Sheet configuration.

---

## 5. Map Technology

Use:

- Leaflet
- OpenStreetMap tiles
- React Leaflet

Google Maps is used only for:

- Places Autocomplete
- Geocoding

Do not use Google Maps for rendering the map.

---

## 6. Authentication

Development:

- Use the provided hardcoded GHL token.

Production:

- Authenticate through the parent window using the postMessage handshake mechanism.

---

## 7. Read-Only Rule

The application is strictly read-only.

Do NOT:

- Update contacts
- Write latitude/longitude back to GHL
- Modify custom fields

Coordinate caching should use:

- Memory cache
- localStorage

---

## 8. Outlook Busy Events

Do not implement Outlook Busy events until the API source is confirmed.

Build appointment functionality first.

---

## 9. Development Principle

When implementing features:

1. Follow the latest meeting instructions first.
2. Follow the project documentation.
3. Reuse as much of the legacy implementation as possible.
4. Only diverge from the legacy when the lead explicitly requested a change.

Meeting decisions always override the legacy HTML.
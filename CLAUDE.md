# CLAUDE.md

# Appointment Map - AI Development Guide

> This document defines the architecture, engineering standards, workflow, and coding conventions for the Appointment Map project. Claude Code must follow this document throughout development.

---

# 1. Project Overview

---

# Existing Codebase & Reuse Strategy

This project is based on an existing GHL Customer Map application. The existing implementation is the reference architecture, not the final codebase.

## Reuse

Reuse proven implementation patterns where appropriate:

- GHL Custom Menu authentication flow (postMessage token exchange)
- GHL API wrapper and request pattern
- Map initialization architecture
- Progressive/batch loading strategy
- Marker clustering/rendering concepts
- Search and filtering concepts
- Google Maps / Leaflet integration where applicable

## Do Not Copy

Do not copy legacy implementation directly into the React application.

Avoid:
- Direct DOM manipulation (`document.querySelector`, `innerHTML`, etc.)
- Global mutable variables
- Large monolithic files
- Inline HTML templates
- Mixing business logic with UI rendering

## React Principles

The React application is the source of truth.

- Use React components.
- Keep state in React.
- Extract reusable hooks where appropriate.
- Separate API, business logic, and UI.
- Build clean, maintainable code without unnecessary abstraction.

Always prefer refactoring an existing idea into idiomatic React instead of translating legacy JavaScript line-by-line.



## Business Problem

Appointment setters currently schedule appointments without knowing where sales representatives already have appointments throughout the day.

This causes situations like:

- Rep has an appointment at 10:00 AM in North Houston
- Another appointment is booked for 11:00 AM in South Houston
- Rep spends over an hour driving
- Company loses productivity

This application solves that problem by providing a visual appointment map before the appointment is booked.

---

## Purpose

The Appointment Map is a scheduling assistance tool.

It DOES NOT replace GoHighLevel scheduling.

It DOES NOT create appointments.

It simply helps appointment setters answer one question:

> "Which sales representative should receive this appointment based on their existing schedule and location?"

---

# 2. Project Goals

The application must:

- Display upcoming appointments on Google Maps
- Display Outlook Busy events
- Help appointment setters identify nearby appointments
- Reduce unnecessary travel
- Load large datasets efficiently
- Feel fast even with hundreds of appointments
- Be reusable across multiple GHL sub-accounts
- Be maintainable by frontend developers

---

# 3. Tech Stack

## Core

- React 19
- Vite
- TypeScript
- Tailwind CSS

## APIs

- GoHighLevel Calendar Events API
- GoHighLevel Contacts API
- Google Maps JavaScript API
- Google Places API
- Google Sheets Web API

## HTTP

- Axios

## Icons

- Lucide React

## Utilities

- clsx
- date-fns

## State

Use React built-in state whenever possible.

Only introduce TanStack Query if API complexity actually requires it.

Do NOT use:

- Redux
- MobX
- Zustand
- Recoil

unless explicitly requested.

---

# 4. Development Philosophy

This is a **mid-level production application**.

Claude must prefer:

- simplicity
- readability
- maintainability

over

- clever code
- unnecessary abstraction
- enterprise patterns

Never over-engineer.

Every abstraction should solve a real problem.

---

# 5. Architecture

The application follows a feature-first architecture.

```
UI

↓

Feature Components

↓

Custom Hooks

↓

Services

↓

API Layer

↓

External APIs
```

Rules:

- UI never calls APIs directly.
- Components never contain business logic.
- Services contain data-fetching logic.
- Hooks coordinate UI behavior.
- Utilities contain pure helper functions.

---

# 6. Suggested Folder Structure

```
src/

app/

components/

ui/

layout/

features/

appointment-map/

appointments/

contacts/

users/

filters/

search/

hooks/

services/

api/

lib/

types/

utils/

constants/

assets/

styles/
```

Feature folders should contain:

```
components/

hooks/

services/

types/

utils/
```

---

# 7. Code Style

Always use:

- Functional Components
- TypeScript
- Named exports

Avoid:

- Default exports unless necessary

Prefer:

```
export function AppointmentMarker() {}
```

instead of

```
export default AppointmentMarker
```

---

# 8. Component Guidelines

A component should have ONE responsibility.

Bad:

```
Map
Fetching
Filtering
Tooltip
Popup
API
```

Good:

```
Map

↓

Marker

↓

Tooltip

↓

Popup
```

---

Component size:

Ideal:

100–150 lines

Maximum:

250 lines

If larger:

Split into smaller components.

---

# 9. State Management

Prefer local state.

Example:

```
selectedUser

selectedDate

selectedMarker

searchQuery
```

Avoid global state unless absolutely necessary.

Global state should only contain application-wide information.

---

# 10. API Layer Rules

Never call APIs inside components.

❌ Bad

```
useEffect(() => {

axios.get(...)

})
```

✅ Good

```
CalendarService

↓

Hook

↓

Component
```

Every endpoint should have its own service.

Example

```
services/

calendar.service.ts

contact.service.ts

google-sheet.service.ts
```

---

# 11. Data Normalization

Never expose raw GHL responses to components.

Always normalize.

Example

Raw API

↓

normalizeAppointment()

↓

UnifiedAppointment

↓

Component

Components should never know the actual API response structure.

---

# 12. Progressive Loading Strategy

Large datasets should load progressively.

Example

```
Fetch 100

↓

Render

↓

Fetch next 100

↓

Render

↓

Continue
```

Never wait for every page before rendering.

The UI should become interactive as quickly as possible.

---

# 13. Contact Retrieval

Appointments do not contain complete location information.

Workflow

```
Calendar Events

↓

Extract Contact IDs

↓

Fetch Contacts

↓

Merge Data

↓

Render Marker
```

Never repeatedly fetch the same contact.

Implement caching.

---

# 14. Local Filtering

After data loads:

Everything happens locally.

Never call APIs for:

- search
- city
- state
- zip
- user
- marker updates

Filtering should operate on memory.

---

# 15. Google Maps Rules

Map component only renders.

It should NOT:

- fetch data
- filter data
- search data

Responsibilities

Map

↓

Render markers

Marker

↓

Display marker

Tooltip

↓

Display details

Popup

↓

Display appointments

Keep these isolated.

---

# 16. Marker Rules

Appointment marker

- user color

Busy marker

- same user color
- black border

Marker label always visible

Display

```
10:00 AM

Michelle
```

Hover reveals:

- address
- company
- date
- representative
- appointment info

---

# 17. User Color Priority

Priority order

1.

Google Sheet color

↓

2.

Cached LocalStorage color

↓

3.

Generate random color

↓

Store in LocalStorage

Never generate a different random color every reload.

---

# 18. Google Sheet Rules

Google Sheet controls

- allowed users
- custom colors

If location exists:

Only display configured users.

If location not found:

Display every user.

Google Sheet always overrides defaults.

---

# 19. Search Rules

Use Google Places.

Single search input.

Should support:

- address
- city
- state
- zip

No separate inputs.

Search updates visible markers.

---

# 20. Tooltip Rules

Hovering a marker should display:

- Contact Name
- Representative
- Company
- Date
- Time
- Address
- Postal Code

Include

View All Appointments

button.

---

# 21. View All Appointments

Popup displays:

All appointments belonging to that representative.

No duplicate API requests.

Cache popup data.

Subsequent openings should use cached data.

---

# 22. Performance Guidelines

Always prefer

- memoization
- lazy rendering
- local filtering
- cached data

Avoid

Repeated loops

Repeated API calls

Repeated object creation

Repeated color generation

---

# 23. Error Handling

Every async operation must handle:

Loading

Error

Empty

Success

Never assume APIs always succeed.

---

# 24. Logging

Development only.

Never leave:

```
console.log()

console.warn()

debugger
```

inside production code.

---

# 25. Environment Variables

Never hardcode:

API Keys

Tokens

URLs

Location IDs

Google Keys

Always use

```
.env
```

Never expose secrets.

---

# 26. Styling Guidelines

Use Tailwind.

Prefer utility classes.

Avoid inline styles unless required by Google Maps.

Maintain consistent spacing.

Avoid arbitrary values unless necessary.

---

# 27. Accessibility

Buttons must have:

- labels
- hover states
- focus states

Keyboard navigation should work where practical.

---

# 28. Reusability

If logic appears twice:

Extract.

If it appears once:

Leave it.

Avoid premature abstraction.

---

# 29. TypeScript Rules

Never use:

```
any
```

Prefer

```
interface

type

generics
```

Use strict typing everywhere.

---

# 30. Naming Conventions

Components

```
AppointmentMarker
```

Hooks

```
useAppointments
```

Services

```
calendar.service.ts
```

Types

```
Appointment.ts
```

Utilities

```
formatDate.ts
```

Constants

```
map.constants.ts
```

---

# 31. Git Workflow

Create one feature branch per feature.

Examples

```
feature/google-map

feature/user-filter

feature/calendar-api

feature/tooltip

feature/view-all-popup
```

Avoid mixing unrelated work in one commit.

---

# 32. Claude Code Workflow

Claude Code must follow these rules:

- Build one feature at a time.
- Never implement multiple major systems in one prompt.
- Explain the approach before generating large code.
- Modify existing files instead of recreating them.
- Follow existing project patterns.
- Prefer incremental improvements.
- Ask questions if requirements are unclear.
- Never guess API responses.
- Never introduce new dependencies without approval.
- Keep code production-ready.
- Avoid unnecessary comments.
- Generate readable code over clever code.

---

# 33. Definition of Done

A feature is considered complete only when:

✅ UI implemented

✅ Responsive

✅ Fully typed

✅ Loading state handled

✅ Error state handled

✅ Empty state handled

✅ API integrated

✅ Uses project architecture

✅ No duplicated logic

✅ No console errors

✅ No lint issues

✅ No TypeScript errors

✅ Reusable

✅ Clean folder placement

---

# 34. Out of Scope

Claude must NOT implement unless explicitly requested:

- Booking appointments
- Editing appointments
- Creating contacts
- Route optimization
- Distance calculations
- Authentication redesign
- Backend services
- Database
- Admin dashboard
- Analytics
- Notifications

---

# 35. Final Principle

This project is intended to be a clean, maintainable, production-ready React application.

Every decision should optimize for:

- Developer experience
- Readability
- Maintainability
- Performance
- Simplicity

When multiple solutions exist:

Choose the simplest solution that satisfies the business requirement.



## Existing Customer Map Reference

This project is an evolution of the existing Customer Map tool. Use the provided HTML/CSS/JS as the reference implementation.

### UI

- Keep the overall layout and visual design consistent with the existing Customer Map.
- Only replace filters that are no longer relevant to appointments.
- Do not redesign the application unless explicitly requested.
- Reuse the existing filter panel, map layout, spacing, and interaction patterns.

### Replace Existing Filters

Remove customer-specific filters such as:
- Contact Type
- Services
- Inspection Plans
- Vendor Name
- Customer Tag

Replace them with appointment-specific controls:
- Sales Representative (multi-select)
- Date / Date Range
- Address Search
- "See Other Appointments" popup on marker interaction

### Authentication

During local development, use a hardcoded GHL token.

For production, use the existing parent-window handshake (postMessage) authentication mechanism from the Customer Map.

Do not implement the production authentication flow until deployment.
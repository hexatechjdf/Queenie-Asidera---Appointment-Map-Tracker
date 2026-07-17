export interface AppointmentCoords {
  lat: number
  lng: number
}

/** Appointment + contact data merged into a single record for the map. */
export interface UnifiedAppointment {
  id: string
  contactId: string
  repId: string
  contactName: string
  companyName: string
  contactType: string
  status: string
  startTime: string
  endTime: string
  timezone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  inspectionPlan: string
  typeOfService: string
  vendorName: string
  fullAddress: string
  coords: AppointmentCoords | null
}

export type AppointmentsStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface AppointmentsState {
  status: AppointmentsStatus
  appointments: UnifiedAppointment[]
  /** Reps processed so far (progressive loading). */
  loaded: number
  /** Total reps to process. */
  total: number
  error: string | null
}

/**
 * A representative's Busy / blocked time, sourced from GHL
 * `GET /calendars/blocked-slots` (external calendar sync, e.g. Google). Busy
 * slots carry no contact, so they have no company/contact location; `coords` is
 * resolved only if the slot itself exposes a usable `address`.
 */
export interface BusyEvent {
  id: string
  repId: string
  title: string
  startTime: string
  endTime: string
  /** Address as returned by the API; empty when the slot carries no location. */
  address: string
  isFullDay: boolean
}

export interface BusyEventsState {
  status: AppointmentsStatus
  busyEvents: BusyEvent[]
  /** Reps processed so far (progressive loading). */
  loaded: number
  /** Total reps to process. */
  total: number
  error: string | null
}

export interface Rep {
  id: string
  name: string
  email: string
  color: string
}

/** A single rep row from the Google Sheet configuration. */
export interface RepSheetEntry {
  userId?: string
  name?: string
  color?: string
}

/** Sheet configuration for one GHL location. */
export interface LocationRepConfig {
  locationId: string
  reps: RepSheetEntry[]
}

export type RepsStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface RepsState {
  status: RepsStatus
  reps: Rep[]
  error: string | null
}

export interface RepsContextValue extends RepsState {
  repsById: Map<string, Rep>
}

export type DateMode = 'after' | 'equal'

export interface AppointmentFilters {
  /** Selected rep ids; empty means all reps. */
  repIds: string[]
  /** Selected date as `yyyy-MM-dd`; empty means no date filter. */
  date: string
  dateMode: DateMode
}

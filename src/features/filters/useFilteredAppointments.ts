import { useMemo } from 'react'
import { filterAppointments } from './filterAppointments'
import type { UnifiedAppointment } from '@/features/appointments/types/appointment.types'
import type { AppointmentFilters } from './types'

/** Memoized in-memory filtered appointments. */
export function useFilteredAppointments(
  appointments: UnifiedAppointment[],
  filters: AppointmentFilters,
): UnifiedAppointment[] {
  return useMemo(
    () => filterAppointments(appointments, filters),
    [appointments, filters],
  )
}

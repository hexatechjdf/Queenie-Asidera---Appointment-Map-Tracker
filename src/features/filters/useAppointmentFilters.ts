import { useCallback, useState } from 'react'
import { todayISODate } from '@/utils/date'
import type { AppointmentFilters, DateMode } from './types'

export function useAppointmentFilters() {
  // Default to today + "after" — the "upcoming from today" view.
  const [filters, setFilters] = useState<AppointmentFilters>(() => ({
    repIds: [],
    date: todayISODate(),
    dateMode: 'after',
  }))

  const setRepIds = useCallback((repIds: string[]) => {
    setFilters((prev) => ({ ...prev, repIds }))
  }, [])

  const setDate = useCallback((date: string) => {
    setFilters((prev) => ({ ...prev, date }))
  }, [])

  const setDateMode = useCallback((dateMode: DateMode) => {
    setFilters((prev) => ({ ...prev, dateMode }))
  }, [])

  return { filters, setRepIds, setDate, setDateMode }
}

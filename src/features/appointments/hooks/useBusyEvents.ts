import { useEffect, useState } from 'react'
import { addDays, startOfDay } from 'date-fns'
import { useGhlAuth } from '@/hooks/useGhlAuth'
import { useReps } from '@/features/users/hooks/useReps'
import { createGhlClient } from '@/services/api/ghlClient'
import { fetchUserBlockedSlots } from '../services/busy.service'
import { normalizeBusyEvent } from '../utils/normalizeBusyEvent'
import { LOOKAHEAD_DAYS } from './useAppointments'
import type { BusyEvent, BusyEventsState } from '../types/appointment.types'

const INITIAL_STATE: BusyEventsState = {
  status: 'idle',
  busyEvents: [],
  loaded: 0,
  total: 0,
  error: null,
}

/**
 * Load Busy / blocked slots for the in-scope reps and normalize them into unified
 * Busy records. Loading is progressive: state updates after each rep's batch.
 *
 * Busy events mean only that the representative is unavailable; their real
 * location is irrelevant (and the API does not expose it), so no geocoding is
 * done here. Map placement uses a deterministic pseudo-position at render time.
 */
export function useBusyEvents(refreshKey = 0): BusyEventsState {
  const { status: authStatus, auth } = useGhlAuth()
  const { status: repsStatus, reps } = useReps()
  const [state, setState] = useState<BusyEventsState>(INITIAL_STATE)

  useEffect(() => {
    if (authStatus !== 'ready' || !auth) return
    if (repsStatus !== 'ready') return

    let active = true
    const client = createGhlClient(auth)
    const start = startOfDay(new Date())
    const startMs = start.getTime()
    const endMs = addDays(start, LOOKAHEAD_DAYS).getTime()

    setState({
      status: 'loading',
      busyEvents: [],
      loaded: 0,
      total: reps.length,
      error: null,
    })

    const load = async () => {
      const accumulated: BusyEvent[] = []
      try {
        for (let i = 0; i < reps.length; i += 1) {
          if (!active) return

          try {
            const slots = await fetchUserBlockedSlots(
              client,
              auth.locationId,
              reps[i].id,
              startMs,
              endMs,
            )
            accumulated.push(...slots.map(normalizeBusyEvent))
          } catch {
            // Skip a rep whose blocked slots can't be loaded and continue.
          }

          if (!active) return
          setState((prev) => ({
            ...prev,
            busyEvents: [...accumulated],
            loaded: i + 1,
          }))
        }

        if (active) setState((prev) => ({ ...prev, status: 'ready' }))
      } catch (error) {
        if (!active) return
        setState((prev) => ({
          ...prev,
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load busy events',
        }))
      }
    }

    void load()

    return () => {
      active = false
    }
    // `refreshKey` re-runs the effect on demand (manual refresh button).
  }, [authStatus, auth, repsStatus, reps, refreshKey])

  return state
}

import { useEffect, useState } from 'react'
import { addDays, startOfDay } from 'date-fns'
import { useGhlAuth } from '@/hooks/useGhlAuth'
import { useReps } from '@/features/users/hooks/useReps'
import { createGhlClient } from '@/services/api/ghlClient'
import { fetchUserAppointments } from '../services/calendar.service'
import { fetchContact } from '../services/contact.service'
import { normalizeAppointment } from '../utils/normalizeAppointment'
import { geocodeAddress } from '@/lib/geocode'
import type {
  AppointmentsState,
  UnifiedAppointment,
} from '../types/appointment.types'

/** Forward window for "upcoming" appointments, from the start of today. */
export const LOOKAHEAD_DAYS = 180

const INITIAL_STATE: AppointmentsState = {
  status: 'idle',
  appointments: [],
  loaded: 0,
  total: 0,
  error: null,
}

/**
 * Load upcoming appointments for the in-scope reps, enrich each with its contact
 * (cached), and normalize into unified records. Loading is progressive: state
 * updates after each rep's batch so the UI can render as data arrives.
 */
export function useAppointments(refreshKey = 0): AppointmentsState {
  const { status: authStatus, auth } = useGhlAuth()
  const { status: repsStatus, reps } = useReps()
  const [state, setState] = useState<AppointmentsState>(INITIAL_STATE)

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
      appointments: [],
      loaded: 0,
      total: reps.length,
      error: null,
    })

    const load = async () => {
      const accumulated: UnifiedAppointment[] = []
      try {
        for (let i = 0; i < reps.length; i += 1) {
          if (!active) return

          try {
            const events = await fetchUserAppointments(
              client,
              auth.locationId,
              reps[i].id,
              startMs,
              endMs,
            )
            const contacts = await Promise.all(
              events.map((event) =>
                event.contactId
                  ? fetchContact(client, event.contactId)
                  : Promise.resolve(null),
              ),
            )

            const normalized = events.map((event, index) =>
              normalizeAppointment(event, contacts[index]),
            )
            const coordsList = await Promise.all(
              normalized.map((appointment) =>
                appointment.fullAddress
                  ? geocodeAddress(appointment.fullAddress)
                  : Promise.resolve(null),
              ),
            )
            accumulated.push(
              ...normalized.map((appointment, index) => ({
                ...appointment,
                coords: coordsList[index],
              })),
            )
          } catch {
            // Skip a rep that can't be loaded (e.g. an invalid or stale user id
            // in the sheet config) and continue with the others.
          }

          if (!active) return
          setState((prev) => ({
            ...prev,
            appointments: [...accumulated],
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
              : 'Failed to load appointments',
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

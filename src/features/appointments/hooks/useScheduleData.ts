import { useEffect, useState } from 'react'
import { addDays, startOfDay } from 'date-fns'
import { useGhlAuth } from '@/hooks/useGhlAuth'
import { useReps } from '@/features/users/hooks/useReps'
import { createGhlClient, type GhlClient } from '@/services/api/ghlClient'
import { fetchUserAppointments } from '../services/calendar.service'
import { fetchUserBlockedSlots } from '../services/busy.service'
import { fetchContact } from '../services/contact.service'
import {
  getCustomFieldMap,
  type CustomFieldMap,
} from '../services/customFields.service'
import { normalizeAppointment } from '../utils/normalizeAppointment'
import { normalizeBusyEvent } from '../utils/normalizeBusyEvent'
import { geocodeAddress } from '@/lib/geocode'
import { mapWithConcurrency } from '@/utils/concurrency'
import type {
  AppointmentsState,
  BusyEvent,
  BusyEventsState,
  UnifiedAppointment,
} from '../types/appointment.types'

/** Forward window for "upcoming" appointments, from the start of today. */
export const LOOKAHEAD_DAYS = 180

/** Users fetched in parallel; bounded to stay within GHL rate limits. */
const USER_FETCH_CONCURRENCY = 5

export interface ScheduleData {
  appointments: AppointmentsState
  busy: BusyEventsState
}

const INITIAL_APPOINTMENTS: AppointmentsState = {
  status: 'idle',
  appointments: [],
  loaded: 0,
  total: 0,
  error: null,
}

const INITIAL_BUSY: BusyEventsState = {
  status: 'idle',
  busyEvents: [],
  loaded: 0,
  total: 0,
  error: null,
}

/**
 * Load one rep's appointments: fetch this rep's calendar events, then enrich each
 * with only the contact it references. `fetchContact` caches/dedupes per id, so a
 * contact shared across appointments/reps is fetched once and never preloaded in
 * bulk — appointments drive exactly which contacts are fetched.
 */
async function loadUserAppointments(
  client: GhlClient,
  locationId: string,
  userId: string,
  startMs: number,
  endMs: number,
  fieldMap: CustomFieldMap,
): Promise<UnifiedAppointment[]> {
  const events = await fetchUserAppointments(client, locationId, userId, startMs, endMs)
  const contacts = await Promise.all(
    events.map((event) =>
      event.contactId
        ? fetchContact(client, event.contactId)
        : Promise.resolve(null),
    ),
  )
  const normalized = events.map((event, index) =>
    normalizeAppointment(event, contacts[index], fieldMap),
  )
  const coordsList = await Promise.all(
    normalized.map((appointment) =>
      // Contacts carrying Latitude/Longitude custom fields already have coords;
      // only the rest fall back to the existing (batched, cached) geocoding.
      appointment.coords
        ? Promise.resolve(appointment.coords)
        : appointment.fullAddress
          ? geocodeAddress(appointment.fullAddress)
          : Promise.resolve(null),
    ),
  )
  return normalized.map((appointment, index) => ({
    ...appointment,
    coords: coordsList[index],
  }))
}

/** Load one rep's Busy / blocked slots and normalize them. */
async function loadUserBusy(
  client: GhlClient,
  locationId: string,
  userId: string,
  startMs: number,
  endMs: number,
): Promise<BusyEvent[]> {
  const slots = await fetchUserBlockedSlots(client, locationId, userId, startMs, endMs)
  return slots.map(normalizeBusyEvent)
}

/**
 * Load upcoming appointments AND Busy events for the in-scope reps. Both GHL
 * endpoints are still required (blocked slots are not exposed by the events
 * endpoint), so for each rep they are fetched concurrently; reps run with bounded
 * concurrency rather than one-at-a-time. Loading stays progressive — state updates
 * as each rep completes — and the two datasets keep their own state shape so the
 * rest of the app is unchanged.
 */
export function useScheduleData(refreshKey = 0): ScheduleData {
  const { status: authStatus, auth } = useGhlAuth()
  const { status: repsStatus, reps } = useReps()
  const [appointments, setAppointments] = useState<AppointmentsState>(
    INITIAL_APPOINTMENTS,
  )
  const [busy, setBusy] = useState<BusyEventsState>(INITIAL_BUSY)

  useEffect(() => {
    if (authStatus !== 'ready' || !auth) return
    if (repsStatus !== 'ready') return

    let active = true
    const client = createGhlClient(auth)
    const start = startOfDay(new Date())
    const startMs = start.getTime()
    const endMs = addDays(start, LOOKAHEAD_DAYS).getTime()

    setAppointments({
      status: 'loading',
      appointments: [],
      loaded: 0,
      total: reps.length,
      error: null,
    })
    setBusy({
      status: 'loading',
      busyEvents: [],
      loaded: 0,
      total: reps.length,
      error: null,
    })

    const load = async () => {
      try {
        // Only the (cheap, cached) custom-field id lookup gates the rep loop, so
        // events + blocked slots start loading immediately. Contacts are fetched
        // per appointment during enrichment — no bulk contact preload.
        const fieldMap = await getCustomFieldMap(client, auth.locationId).catch(
          (): CustomFieldMap => ({}),
        )

        await mapWithConcurrency(reps, USER_FETCH_CONCURRENCY, async (rep) => {
          if (!active) return

          // Both endpoints for this rep start together. Each guards its own
          // errors so a failing endpoint (e.g. a stale user id) drops only its
          // own data and never the other's — matching the previous per-rep skip.
          const [appts, busies] = await Promise.all([
            loadUserAppointments(
              client,
              auth.locationId,
              rep.id,
              startMs,
              endMs,
              fieldMap,
            ).catch(() => [] as UnifiedAppointment[]),
            loadUserBusy(client, auth.locationId, rep.id, startMs, endMs).catch(
              () => [] as BusyEvent[],
            ),
          ])

          if (!active) return
          setAppointments((prev) => ({
            ...prev,
            appointments: [...prev.appointments, ...appts],
            loaded: prev.loaded + 1,
          }))
          setBusy((prev) => ({
            ...prev,
            busyEvents: [...prev.busyEvents, ...busies],
            loaded: prev.loaded + 1,
          }))
        })

        if (active) {
          setAppointments((prev) => ({ ...prev, status: 'ready' }))
          setBusy((prev) => ({ ...prev, status: 'ready' }))
        }
      } catch (error) {
        if (!active) return
        const message =
          error instanceof Error ? error.message : 'Failed to load schedule'
        setAppointments((prev) => ({ ...prev, status: 'error', error: message }))
        setBusy((prev) => ({ ...prev, status: 'error', error: message }))
      }
    }

    void load()

    return () => {
      active = false
    }
    // `refreshKey` re-runs the effect on demand (manual refresh button).
  }, [authStatus, auth, repsStatus, reps, refreshKey])

  return { appointments, busy }
}

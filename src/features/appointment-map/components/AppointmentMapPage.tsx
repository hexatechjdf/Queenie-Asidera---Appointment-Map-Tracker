import { useCallback, useMemo, useState } from 'react'
import { MapContainer } from './MapContainer'
import { RepAppointmentsModal } from './RepAppointmentsModal'
import type { RepScheduleItem } from './RepAppointmentsModal'
import { FilterPanel } from '@/components/layout/FilterPanel'
import { LoadProgress } from '@/features/appointments/components/LoadProgress'
import { MapLoadingOverlay } from './MapLoadingOverlay'
import { MapEmptyState } from './MapEmptyState'
import { useAppointments } from '@/features/appointments/hooks/useAppointments'
import { useBusyEvents } from '@/features/appointments/hooks/useBusyEvents'
import { useReps } from '@/features/users/hooks/useReps'
import { useRepColors } from '@/features/users/hooks/useRepColors'
import { useAppointmentFilters } from '@/features/filters/useAppointmentFilters'
import { useFilteredAppointments } from '@/features/filters/useFilteredAppointments'
import { filterAppointments } from '@/features/filters/filterAppointments'
import { computeMarkerPositions } from '../utils/markerPositions'
import type { SearchLocation } from '@/features/search/types'
import type { AppointmentCoords } from '@/features/appointments/types/appointment.types'

/**
 * Top-level map screen. Loads appointments progressively, applies rep/date
 * filters in memory, and renders the result as markers colored by representative.
 */
export function AppointmentMapPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const appointments = useAppointments(refreshKey)
  const busy = useBusyEvents(refreshKey)
  const { reps, status: repsStatus } = useReps()
  const colorOf = useRepColors()
  const { filters, setRepIds, setDate, setDateMode } = useAppointmentFilters()
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null)
  const [viewAllRepId, setViewAllRepId] = useState<string | null>(null)
  const [flyTo, setFlyTo] = useState<AppointmentCoords | null>(null)
  const [cluster, setCluster] = useState(false)

  const handleRefresh = useCallback(() => setRefreshKey((key) => key + 1), [])

  const filtered = useFilteredAppointments(appointments.appointments, filters)

  // Exact on-map position per appointment id (same fan-out the markers use), so
  // "go to appointment" lands on the marker itself, not the shared-coordinate
  // ring centre.
  const markerPositions = useMemo(
    () => computeMarkerPositions(filtered),
    [filtered],
  )

  // Clicking an appointment in the View-All popup flies the map to its exact
  // marker (falling back to the raw coords if it isn't currently drawn) and closes
  // the popup. A fresh object re-triggers the fly even for the same coordinates.
  const handleSelectLocation = useCallback(
    (target: { id: string; coords: AppointmentCoords }) => {
      const pos = markerPositions.get(target.id)
      const [lat, lng] = pos ?? [target.coords.lat, target.coords.lng]
      setFlyTo({ lat, lng })
      setViewAllRepId(null)
    },
    [markerPositions],
  )

  // Busy events flow through the same rep/date filter as appointments.
  const filteredBusy = useMemo(
    () => filterAppointments(busy.busyEvents, filters),
    [busy.busyEvents, filters],
  )

  // Anchor Busy markers near the real appointments: centroid of all loaded
  // appointment coordinates (null until any geocode succeeds). Based on the full
  // set (not filters) so Busy positions stay stable as filters change.
  const busyAnchor = useMemo(() => {
    const points = appointments.appointments.filter((a) => a.coords)
    if (!points.length) return null
    const sum = points.reduce(
      (acc, a) => ({ lat: acc.lat + a.coords!.lat, lng: acc.lng + a.coords!.lng }),
      { lat: 0, lng: 0 },
    )
    return { lat: sum.lat / points.length, lng: sum.lng / points.length }
  }, [appointments.appointments])

  // "View All Appointments" lists the rep's entire schedule from already-loaded
  // data — appointments AND busy blocks — independent of the active filters
  // (CLAUDE §21 — no re-fetch).
  const repSchedule = useMemo<RepScheduleItem[]>(() => {
    if (!viewAllRepId) return []
    const appts: RepScheduleItem[] = appointments.appointments
      .filter((a) => a.repId === viewAllRepId)
      .map((a) => ({
        id: a.id,
        kind: 'appointment',
        title: a.contactName,
        startTime: a.startTime,
        endTime: a.endTime,
        subtitle: a.companyName,
        address: a.fullAddress,
        coords: a.coords ?? undefined,
      }))
    const busies: RepScheduleItem[] = busy.busyEvents
      .filter((b) => b.repId === viewAllRepId)
      .map((b) => ({
        id: b.id,
        kind: 'busy',
        title: b.title || 'Busy',
        startTime: b.startTime,
        endTime: b.endTime,
        address: b.address,
      }))
    return [...appts, ...busies]
  }, [appointments.appointments, busy.busyEvents, viewAllRepId])

  // Prominent loader during the initial load; hidden once appointments render or
  // an error occurs (so it never gets stuck).
  const appointmentsPending =
    appointments.status === 'idle' ||
    (appointments.status === 'loading' && appointments.appointments.length === 0)
  const isInitialLoading =
    repsStatus !== 'error' && (repsStatus !== 'ready' || appointmentsPending)

  // Empty state: a specific rep is selected (not "All Users") but nothing matches
  // — including busy events. Only once both datasets have finished loading, so it
  // never flashes mid-load. Derives from the filtered results, so it auto-hides
  // when matches appear or the filter changes.
  const dataSettled =
    (appointments.status === 'ready' || appointments.status === 'error') &&
    (busy.status === 'ready' || busy.status === 'error')
  const showNoResults =
    dataSettled &&
    !isInitialLoading &&
    filters.repIds.length > 0 &&
    filtered.length === 0 &&
    filteredBusy.length === 0

  const repsById = useMemo(
    () => new Map(reps.map((rep) => [rep.id, rep])),
    [reps],
  )
  const nameOf = useCallback(
    (repId: string) => repsById.get(repId)?.name ?? 'Unassigned',
    [repsById],
  )

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <MapContainer
          appointments={filtered}
          busyEvents={filteredBusy}
          busyAnchor={busyAnchor}
          colorOf={colorOf}
          nameOf={nameOf}
          cluster={cluster}
          searchLocation={searchLocation}
          flyTo={flyTo}
          onViewAll={setViewAllRepId}
        />
      </div>
      {isInitialLoading && <MapLoadingOverlay message="Fetching appointments…" />}
      {showNoResults && (
        <MapEmptyState message="No appointments found for the selected representative." />
      )}
      <FilterPanel
        filters={filters}
        onRepIdsChange={setRepIds}
        onDateChange={setDate}
        onDateModeChange={setDateMode}
        onSearchSelect={setSearchLocation}
        cluster={cluster}
        onClusterToggle={setCluster}
        onRefresh={handleRefresh}
        isRefreshing={appointments.status === 'loading'}
      />
      <LoadProgress {...appointments} />
      {viewAllRepId && (
        <RepAppointmentsModal
          repName={nameOf(viewAllRepId)}
          color={colorOf(viewAllRepId)}
          items={repSchedule}
          onClose={() => setViewAllRepId(null)}
          onSelectLocation={handleSelectLocation}
        />
      )}
    </div>
  )
}

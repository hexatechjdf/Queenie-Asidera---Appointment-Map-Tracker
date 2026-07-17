import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Calendar, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDate, formatTime } from '@/utils/date'
import type { AppointmentCoords } from '@/features/appointments/types/appointment.types'

/** Modal list view: everything, only active appointments, or only busy blocks. */
type ScheduleView = 'all' | 'active' | 'busy'

/** One row in a representative's schedule — an appointment or a busy block. */
export interface RepScheduleItem {
  id: string
  kind: 'appointment' | 'busy'
  title: string
  startTime: string
  endTime: string
  subtitle?: string
  address?: string
  /** Present for appointments with a resolved location; makes the row clickable. */
  coords?: AppointmentCoords
}

interface RepAppointmentsModalProps {
  repName: string
  color: string
  items: RepScheduleItem[]
  onClose: () => void
  onSelectLocation: (target: { id: string; coords: AppointmentCoords }) => void
}

/** Chronological order by wall-clock start time (ISO strings sort lexically). */
function byStartTime(a: RepScheduleItem, b: RepScheduleItem): number {
  return a.startTime.localeCompare(b.startTime)
}

/**
 * Popup listing a representative's full schedule — every appointment AND busy
 * block. Data comes from the already-loaded set (no re-fetch) and is not filtered
 * by the active map filters. Appointments are shown first (chronological), then
 * busy blocks; an in-modal view toggle and date filter narrow the list locally.
 * Clicking an appointment row flies the map to that appointment.
 */
export function RepAppointmentsModal({
  repName,
  color,
  items,
  onClose,
  onSelectLocation,
}: RepAppointmentsModalProps) {
  const [view, setView] = useState<ScheduleView>('all')
  const [dateFilter, setDateFilter] = useState('')

  // Split into appointment/busy groups, each date-filtered and sorted. The date
  // input value is `yyyy-MM-dd`; item start dates compare on their leading 10
  // chars (the wall-clock date), consistent with how the list renders dates.
  const { appointmentRows, busyRows } = useMemo(() => {
    const matchesDate = (item: RepScheduleItem) =>
      !dateFilter || item.startTime.slice(0, 10) === dateFilter
    return {
      appointmentRows: items
        .filter((item) => item.kind === 'appointment' && matchesDate(item))
        .sort(byStartTime),
      busyRows: items
        .filter((item) => item.kind === 'busy' && matchesDate(item))
        .sort(byStartTime),
    }
  }, [items, dateFilter])

  // "All" shows both groups, "Active" only appointments, "Busy" only busy blocks.
  const visibleAppointments = view === 'busy' ? [] : appointmentRows
  const visibleBusy = view === 'active' ? [] : busyRows
  const totalVisible = visibleAppointments.length + visibleBusy.length
  const showBusyDivider =
    view === 'all' && visibleAppointments.length > 0 && visibleBusy.length > 0

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const renderRow = (item: RepScheduleItem) => {
    const content = (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-800">
              {item.title}
            </span>
            {item.kind === 'busy' && (
              <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Busy
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-medium text-indigo-600">
            Start: {formatDate(item.startTime)} · {formatTime(item.startTime)}
          </p>
          {item.endTime && (
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              End: {formatDate(item.endTime)} · {formatTime(item.endTime)}
            </p>
          )}
          {item.subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
          )}
          {item.address && (
            <p className="mt-0.5 text-xs text-slate-500">{item.address}</p>
          )}
        </div>
        {item.coords && (
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
        )}
      </div>
    )

    return (
      <li key={`${item.kind}-${item.id}`}>
        {item.coords ? (
          <button
            type="button"
            onClick={() => onSelectLocation({ id: item.id, coords: item.coords! })}
            title="Go to this appointment on the map"
            className="block w-full cursor-pointer px-5 py-3 text-left transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:bg-indigo-50"
          >
            {content}
          </button>
        ) : (
          <div className="px-5 py-3">{content}</div>
        )}
      </li>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Schedule for ${repName}`}
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{repName}</h2>
              <p className="text-xs text-slate-500">
                {totalVisible} {totalVisible === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-nowrap items-center gap-2 border-b border-slate-200 px-5 py-3">
          <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(
              [
                ['all', 'All', 'All Appointments'],
                ['active', 'Active', 'Active Appointments'],
                ['busy', 'Busy', 'Busy Appointments'],
              ] as const
            ).map(([option, label, fullLabel]) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                aria-label={fullLabel}
                title={fullLabel}
                className={cn(
                  'cursor-pointer whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  view === option
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative ml-auto flex min-w-0 shrink items-center">
            <Calendar className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter by date"
              className="h-8 w-full min-w-0 rounded-md border border-slate-200 bg-white pl-8 pr-2 text-xs text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                aria-label="Clear date filter"
                className="ml-1 cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <ul className="divide-y divide-slate-100 overflow-y-auto">
          {totalVisible === 0 && (
            <li className="px-5 py-6 text-center text-sm text-slate-500">
              Nothing scheduled.
            </li>
          )}
          {visibleAppointments.map(renderRow)}
          {showBusyDivider && (
            <li
              aria-hidden
              className="bg-slate-50 px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
            >
              Busy
            </li>
          )}
          {visibleBusy.map(renderRow)}
        </ul>
      </div>
    </div>
  )
}

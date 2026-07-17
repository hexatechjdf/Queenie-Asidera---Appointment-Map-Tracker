import { useState } from 'react'
import { ChevronDown, Filter, Layers, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { PlacesAutocomplete } from '@/features/search/PlacesAutocomplete'
import { RepFilter } from '@/features/filters/RepFilter'
import { DateFilter } from '@/features/filters/DateFilter'
import type { AppointmentFilters, DateMode } from '@/features/filters/types'
import type { SearchLocation } from '@/features/search/types'

interface FilterPanelProps {
  filters: AppointmentFilters
  onRepIdsChange: (repIds: string[]) => void
  onDateChange: (date: string) => void
  onDateModeChange: (mode: DateMode) => void
  onSearchSelect: (location: SearchLocation | null) => void
  /** Whether appointment markers are grouped into clusters. */
  cluster: boolean
  onClusterToggle: (enabled: boolean) => void
  /** Re-fetch appointments and busy events. */
  onRefresh: () => void
  isRefreshing: boolean
}

/**
 * Floating glass filter panel, ported from the legacy Customer Map layout.
 * Collapsible via React state. Hosts the appointment-specific filter controls.
 */
export function FilterPanel({
  filters,
  onRepIdsChange,
  onDateChange,
  onDateModeChange,
  onSearchSelect,
  cluster,
  onClusterToggle,
  onRefresh,
  isRefreshing,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div
      id="appt-filter-panel"
      className="fixed inset-x-4 top-4 z-[1100] mx-auto max-w-[1280px] rounded-2xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-md backdrop-saturate-150"
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="filter-panel-body"
        className={cn(
          'flex w-full select-none items-center gap-2.5 px-5 py-3.5 text-left',
          isOpen && 'border-b border-slate-200',
        )}
      >
        <span className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-slate-900">
          <Filter className="h-[18px] w-[18px] text-indigo-600" />
          Appointment Map Filters
        </span>
        <span className="ml-auto hidden text-xs font-medium text-slate-400 sm:inline">
          Filter appointments by representative, date, and location
        </span>
        <span className="ml-auto inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-slate-900/[0.04] text-slate-500 sm:ml-3">
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              !isOpen && '-rotate-90',
            )}
          />
        </span>
      </button>

      {isOpen && (
        <div
          id="filter-panel-body"
          className="flex flex-col gap-3 px-5 pb-4 pt-4"
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <PlacesAutocomplete onSelect={onSearchSelect} />
            <RepFilter selected={filters.repIds} onChange={onRepIdsChange} />
            <div className="lg:col-span-2">
              <DateFilter
                date={filters.date}
                mode={filters.dateMode}
                onDateChange={onDateChange}
                onModeChange={onDateModeChange}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-slate-600">
              <Layers className="h-4 w-4 text-indigo-600" />
              Cluster markers
              <input
                type="checkbox"
                checked={cluster}
                onChange={(event) => onClusterToggle(event.target.checked)}
                className="peer sr-only"
              />
              <span className="relative ml-1 h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-4 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500" />
            </label>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
              />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

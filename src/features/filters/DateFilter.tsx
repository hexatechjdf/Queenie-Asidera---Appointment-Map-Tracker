import { Calendar, ChevronDown } from 'lucide-react'
import { todayISODate } from '@/utils/date'
import type { DateMode } from './types'

interface DateFilterProps {
  date: string
  mode: DateMode
  onDateChange: (date: string) => void
  onModeChange: (mode: DateMode) => void
}

/**
 * Appointment date filter as a single merged control: an After/Equal mode
 * selector and a date input sharing one field.
 *   - "After" (default): appointments on or after the selected date
 *   - "Equal": appointments on that exact date only
 * Past dates are not selectable.
 */
export function DateFilter({
  date,
  mode,
  onDateChange,
  onModeChange,
}: DateFilterProps) {
  return (
    <div className="flex h-[42px] items-stretch overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm transition focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10">
      <div className="relative flex items-stretch">
        <select
          value={mode}
          onChange={(event) => onModeChange(event.target.value as DateMode)}
          aria-label="Date match mode"
          className="h-full cursor-pointer appearance-none bg-transparent pl-3 pr-8 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50"
        >
          <option value="after">After</option>
          <option value="equal">Equal</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      <span className="my-2 w-px shrink-0 bg-slate-200" />

      <div className="relative flex flex-1 items-center">
        <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
        <input
          type="date"
          value={date}
          min={todayISODate()}
          onChange={(event) => onDateChange(event.target.value)}
          aria-label="Appointment date"
          className="h-full w-full bg-transparent pl-9 pr-3 text-sm text-slate-900 outline-none"
        />
      </div>
    </div>
  )
}

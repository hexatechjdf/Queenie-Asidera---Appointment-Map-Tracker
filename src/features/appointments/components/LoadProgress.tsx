import { Spinner } from '@/components/ui/Spinner'
import type { AppointmentsState } from '../types/appointment.types'

type LoadProgressProps = Pick<
  AppointmentsState,
  'status' | 'appointments' | 'loaded' | 'total'
>

/**
 * Non-blocking progress indicator for progressive appointment loading. Shows a
 * live count while loading, then the total or an empty/error state.
 */
export function LoadProgress({
  status,
  appointments,
  loaded,
  total,
}: LoadProgressProps) {
  if (status === 'idle') return null

  const count = appointments.length
  const mapped = appointments.filter((appointment) => appointment.coords).length

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[1000] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-md backdrop-blur">
      {status === 'loading' && (
        <span className="flex items-center gap-2">
          <Spinner className="h-4 w-4" />
          Loading appointments… {loaded}/{total} reps · {count} found
        </span>
      )}
      {status === 'ready' && (
        <span>
          {count > 0
            ? `${count} upcoming appointment${count === 1 ? '' : 's'} · ${mapped} mapped`
            : 'No upcoming appointments'}
        </span>
      )}
      {status === 'error' && (
        <span className="text-red-600">Couldn’t load appointments</span>
      )}
    </div>
  )
}

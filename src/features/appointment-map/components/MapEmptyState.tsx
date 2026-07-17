import { MapPinOff } from 'lucide-react'

/**
 * Centered message shown over the map when the active filter matches no
 * appointments (e.g. a specific representative with nothing scheduled), so the
 * map area reads as "empty" rather than broken. Purely informational — it does
 * not block map interaction.
 */
export function MapEmptyState({ message }: { message: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1050] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-7 py-6 text-center shadow-xl">
        <MapPinOff className="h-7 w-7 text-slate-400" aria-hidden />
        <span className="max-w-xs text-sm font-medium text-slate-600">
          {message}
        </span>
      </div>
    </div>
  )
}

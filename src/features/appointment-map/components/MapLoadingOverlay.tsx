import { Spinner } from '@/components/ui/Spinner'

/**
 * Prominent overlay shown over the map during the initial data load, so the map
 * area clearly reads as "loading" rather than broken. Hidden once appointments
 * begin rendering.
 */
export function MapLoadingOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-[1050] flex items-center justify-center bg-slate-100/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-7 py-6 shadow-xl">
        <Spinner className="h-7 w-7" />
        <span className="text-sm font-medium text-slate-600">{message}</span>
      </div>
    </div>
  )
}

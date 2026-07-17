import { useGhlAuth } from '@/hooks/useGhlAuth'
import { Spinner } from '@/components/ui/Spinner'
import { AppointmentMapPage } from '@/features/appointment-map/components/AppointmentMapPage'

export function App() {
  const { status, error } = useGhlAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-slate-100 text-sm text-slate-500">
        <Spinner />
        Connecting to GoHighLevel…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-100 px-6 text-center text-slate-900">
        <h1 className="text-lg font-semibold">Appointment Map</h1>
        <p className="max-w-md text-sm text-red-600">
          Could not authenticate: {error}
        </p>
      </div>
    )
  }

  return <AppointmentMapPage />
}

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Users } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useReps } from '@/features/users/hooks/useReps'

interface RepFilterProps {
  selected: string[]
  onChange: (repIds: string[]) => void
}

/**
 * Sales representative multi-select. Options come from the reps provider (Google
 * Sheet config or all users). An empty selection means "all representatives".
 */
export function RepFilter({ selected, onChange }: RepFilterProps) {
  const { status, reps } = useReps()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  const isReady = status === 'ready' && reps.length > 0

  const label =
    status === 'loading'
      ? 'Loading representatives…'
      : status === 'error'
        ? 'Representatives unavailable'
        : !isReady
          ? 'No representatives'
          : selected.length === 0
            ? 'All users'
            : `${selected.length} selected`

  function toggle(repId: string) {
    onChange(
      selected.includes(repId)
        ? selected.filter((id) => id !== repId)
        : [...selected, repId],
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-slate-400">
        <Users className="h-4 w-4" />
      </span>
      <button
        type="button"
        disabled={!isReady}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter by sales representative"
        onClick={() => setOpen((value) => !value)}
        className="flex h-[42px] w-full items-center justify-between rounded-[10px] border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition hover:border-slate-300 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/10 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className={selected.length ? 'text-slate-900' : 'text-slate-400'}>
          {label}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && isReady && (
        <div
          role="listbox"
          className="absolute z-[1200] mt-1.5 max-h-64 w-full overflow-auto rounded-[10px] border border-slate-200 bg-white p-1 shadow-xl"
        >
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mb-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Clear selection
            </button>
          )}
          {reps.map((rep) => {
            const checked = selected.includes(rep.id)
            return (
              <label
                key={rep.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    checked
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300',
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-white shadow"
                  style={{ background: rep.color }}
                />
                <span className="truncate text-slate-700">{rep.name}</span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggle(rep.id)}
                />
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

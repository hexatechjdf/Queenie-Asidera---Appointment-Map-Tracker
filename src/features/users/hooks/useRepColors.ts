import { useCallback } from 'react'
import { useRepsContext } from '../reps-context'
import { resolveRepColor } from '../utils/repColor'

/**
 * Returns a lookup for a rep's marker color. Falls back to a generated color for
 * ids not present in the loaded rep set.
 */
export function useRepColors(): (repId: string) => string {
  const { repsById } = useRepsContext()

  return useCallback(
    (repId: string) => repsById.get(repId)?.color ?? resolveRepColor(repId),
    [repsById],
  )
}

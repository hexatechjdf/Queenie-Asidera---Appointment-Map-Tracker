import { useRepsContext } from '../reps-context'
import type { RepsState } from '../types/rep.types'

export function useReps(): RepsState {
  const { status, reps, error } = useRepsContext()
  return { status, reps, error }
}

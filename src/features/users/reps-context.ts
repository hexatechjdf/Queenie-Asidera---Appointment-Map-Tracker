import { createContext, useContext } from 'react'
import type { RepsContextValue } from './types/rep.types'

export const RepsContext = createContext<RepsContextValue | null>(null)

export function useRepsContext(): RepsContextValue {
  const context = useContext(RepsContext)

  if (!context) {
    throw new Error('Rep hooks must be used within a RepsProvider')
  }

  return context
}

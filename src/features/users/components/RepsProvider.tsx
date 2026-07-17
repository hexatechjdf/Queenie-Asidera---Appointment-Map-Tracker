import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RepsContext } from '../reps-context'
import { useGhlAuth } from '@/hooks/useGhlAuth'
import { createGhlClient } from '@/services/api/ghlClient'
import { resolveReps } from '../services/reps.service'
import type { RepsState } from '../types/rep.types'

interface RepsProviderProps {
  children: ReactNode
}

const INITIAL_STATE: RepsState = { status: 'idle', reps: [], error: null }

export function RepsProvider({ children }: RepsProviderProps) {
  const { status: authStatus, auth } = useGhlAuth()
  const [state, setState] = useState<RepsState>(INITIAL_STATE)

  useEffect(() => {
    if (authStatus !== 'ready' || !auth) return

    let active = true
    setState({ status: 'loading', reps: [], error: null })
    const client = createGhlClient(auth)

    resolveReps(client, auth.locationId)
      .then((reps) => {
        if (active) setState({ status: 'ready', reps, error: null })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState({
          status: 'error',
          reps: [],
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load representatives',
        })
      })

    return () => {
      active = false
    }
  }, [authStatus, auth])

  const value = useMemo(
    () => ({ ...state, repsById: new Map(state.reps.map((rep) => [rep.id, rep])) }),
    [state],
  )

  return <RepsContext.Provider value={value}>{children}</RepsContext.Provider>
}

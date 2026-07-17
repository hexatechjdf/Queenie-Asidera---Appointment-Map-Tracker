import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import { resolveGhlAuth } from '@/services/api/auth'
import type { AuthState } from '@/types/auth.types'

interface AuthProviderProps {
  children: ReactNode
}

const INITIAL_STATE: AuthState = {
  status: 'loading',
  auth: null,
  error: null,
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE)

  useEffect(() => {
    let active = true

    resolveGhlAuth()
      .then((auth) => {
        if (active) setState({ status: 'ready', auth, error: null })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState({
          status: 'error',
          auth: null,
          error: error instanceof Error ? error.message : 'Authentication failed',
        })
      })

    return () => {
      active = false
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

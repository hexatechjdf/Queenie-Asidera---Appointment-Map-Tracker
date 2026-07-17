import { useContext } from 'react'
import { AuthContext } from '@/app/providers/auth-context'
import type { AuthState } from '@/types/auth.types'

export function useGhlAuth(): AuthState {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useGhlAuth must be used within an AuthProvider')
  }

  return context
}

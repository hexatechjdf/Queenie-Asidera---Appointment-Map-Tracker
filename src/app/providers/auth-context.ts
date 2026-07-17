import { createContext } from 'react'
import type { AuthState } from '@/types/auth.types'

/**
 * Holds the resolved GHL auth session. Null when read outside an AuthProvider,
 * which the useGhlAuth hook guards against.
 */
export const AuthContext = createContext<AuthState | null>(null)

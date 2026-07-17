export interface GhlAuth {
  token: string
  locationId: string
}

export type AuthStatus = 'loading' | 'ready' | 'error'

export interface AuthState {
  status: AuthStatus
  auth: GhlAuth | null
  error: string | null
}

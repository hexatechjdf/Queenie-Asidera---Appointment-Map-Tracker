import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios'
import { GHL_API_BASE, GHL_API_VERSION } from '@/constants/api.constants'
import type { GhlAuth } from '@/types/auth.types'

export class GhlApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GhlApiError'
    this.status = status
  }
}

/**
 * Minimal typed HTTP surface exposed to services. Methods resolve to the
 * response body directly so callers never handle Axios response objects.
 */
export interface GhlClient {
  get: <T>(path: string, config?: AxiosRequestConfig) => Promise<T>
  post: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) => Promise<T>
  put: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) => Promise<T>
}

function createInstance(auth: GhlAuth): AxiosInstance {
  const instance = axios.create({
    baseURL: GHL_API_BASE,
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      channel: 'APP',
      source: 'WEB_USER',
      version: GHL_API_VERSION,
      'token-id': auth.token,
    },
  })

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status
      const url = error.config?.url ?? ''
      return Promise.reject(
        new GhlApiError(
          `GHL request failed${status ? ` (${status})` : ''}: ${url}`,
          status,
        ),
      )
    },
  )

  return instance
}

/**
 * Build a GHL client bound to a resolved auth session. Headers are applied once
 * so every service call is authenticated without repeating the token handshake.
 */
export function createGhlClient(auth: GhlAuth): GhlClient {
  const instance = createInstance(auth)

  return {
    get: (path, config) => instance.get(path, config).then((response) => response.data),
    post: (path, body, config) =>
      instance.post(path, body, config).then((response) => response.data),
    put: (path, body, config) =>
      instance.put(path, body, config).then((response) => response.data),
  }
}

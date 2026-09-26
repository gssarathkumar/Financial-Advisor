export type Session = { user: { id?: string; name: string; email: string; needsOnboarding?: boolean; riskLevel?: string }; accessToken: string }

const apiUrl = import.meta.env.VITE_API_URL ?? ''
let accessToken: string | null = null
let restorePromise: Promise<Session | null> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  return fetch(`${apiUrl}${path}`, { ...init, headers, credentials: 'include' })
}

export function restoreSession(): Promise<Session | null> {
  if (!restorePromise) {
    restorePromise = apiRequest('/api/auth/refresh', { method: 'POST' })
      .then(async response => {
        if (!response.ok) return null
        const session = await response.json() as Session
        setAccessToken(session.accessToken)
        return session
      })
      .catch(() => null)
  }
  return restorePromise
}
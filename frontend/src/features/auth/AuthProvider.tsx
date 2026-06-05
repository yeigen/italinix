import { useEffect, useState } from 'react'
import { ApiError } from '../../lib/api'
import { getCurrentUser, login as loginRequest, register as registerRequest } from './authApi'
import { AuthContext, type AuthStatus } from './authContext'
import { clearStoredToken, getStoredToken, storeToken } from './tokenStorage'
import type { AuthUser, LoginCredentials, RegisterPayload } from './types'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => getStoredToken())

  useEffect(() => {
    let ignore = false

    async function restoreSession() {
      const storedToken = getStoredToken()

      if (!storedToken) {
        setStatus('unauthenticated')
        return
      }

      try {
        const currentUser = await getCurrentUser(storedToken)
        if (!ignore) {
          setToken(storedToken)
          setUser(currentUser)
          setStatus('authenticated')
        }
      } catch {
        if (!ignore) {
          clearStoredToken()
          setToken(null)
          setUser(null)
          setStatus('unauthenticated')
        }
      }
    }

    restoreSession()

    return () => {
      ignore = true
    }
  }, [])

  async function login(credentials: LoginCredentials) {
    const tokenResponse = await loginRequest(credentials)
    storeToken(tokenResponse.access_token)

    try {
      const currentUser = await getCurrentUser(tokenResponse.access_token)
      setToken(tokenResponse.access_token)
      setUser(currentUser)
      setStatus('authenticated')
      return currentUser
    } catch (error) {
      clearStoredToken()
      setToken(null)
      setUser(null)
      setStatus('unauthenticated')

      if (error instanceof ApiError) {
        throw error
      }

      throw new Error('No se pudo recuperar la sesion', { cause: error })
    }
  }

  async function register(payload: RegisterPayload) {
    await registerRequest(payload)
    return login({ email: payload.email, password: payload.password })
  }

  function logout() {
    clearStoredToken()
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{ status, user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

import { apiFetch } from '../../lib/api'
import type { AuthUser, LoginCredentials, RegisterPayload, TokenResponse } from './types'

export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', { token })
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  return apiFetch<AuthUser>('/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

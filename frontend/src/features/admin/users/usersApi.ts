import { apiFetch } from '../../../lib/api'

export type UserRole = 'cliente' | 'admin' | 'repartidor'

export type AdminUser = {
  id: number
  name: string
  email: string
  phone: string | null
  rol: UserRole
  active: boolean
  create_date: string
}

export type UserPayload = {
  name: string
  email: string
  password: string
  phone: string | null
  rol: UserRole
  active: boolean
}

export type UserUpdatePayload = Partial<UserPayload>

export async function getUsers(token: string): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/users/', { token })
}

export async function createUser(payload: UserPayload, token: string): Promise<AdminUser> {
  return apiFetch<AdminUser>('/users/admin', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateUser(
  userId: number,
  payload: UserUpdatePayload,
  token: string,
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteUser(userId: number, token: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, {
    method: 'DELETE',
    token,
  })
}

export type UserRole = 'cliente' | 'admin' | 'repartidor'

export type AuthUser = {
  id: number
  name: string
  email: string
  phone: string | null
  rol: UserRole
  active: boolean
  create_date: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  phone: string | null
  rol: 'cliente'
  active: true
}

export type TokenResponse = {
  access_token: string
  token_type: 'bearer'
}

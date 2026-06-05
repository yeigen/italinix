const DEFAULT_API_URL = 'http://localhost:8000'

export const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL

type ApiFetchOptions = RequestInit & {
  token?: string | null
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function resolveImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) {
    return undefined
  }
  return imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, data)
  }

  return data as T
}

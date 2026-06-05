import { apiFetch } from '../../../lib/api'

export type Category = {
  id: number
  name: string
  description: string | null
}

export type CategoryPayload = {
  name: string
  description: string | null
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/categories/')
}

export async function createCategory(
  payload: CategoryPayload,
  token: string,
): Promise<Category> {
  return apiFetch<Category>('/categories/', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateCategory(
  categoryId: number,
  payload: Partial<CategoryPayload>,
  token: string,
): Promise<Category> {
  return apiFetch<Category>(`/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteCategory(categoryId: number, token: string): Promise<void> {
  return apiFetch<void>(`/categories/${categoryId}`, {
    method: 'DELETE',
    token,
  })
}

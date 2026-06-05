import { apiFetch } from '../../../lib/api'

export type Ingredient = {
  id: number
  name: string
  additional_price: string
}

export type IngredientPayload = {
  name: string
  additional_price: string
}

export async function getIngredients(): Promise<Ingredient[]> {
  return apiFetch<Ingredient[]>('/ingredients/')
}

export async function createIngredient(
  payload: IngredientPayload,
  token: string,
): Promise<Ingredient> {
  return apiFetch<Ingredient>('/ingredients/', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateIngredient(
  ingredientId: number,
  payload: Partial<IngredientPayload>,
  token: string,
): Promise<Ingredient> {
  return apiFetch<Ingredient>(`/ingredients/${ingredientId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteIngredient(ingredientId: number, token: string): Promise<void> {
  return apiFetch<void>(`/ingredients/${ingredientId}`, {
    method: 'DELETE',
    token,
  })
}

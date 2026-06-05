import { apiFetch } from '../../../lib/api'
import type { Category } from '../categories/categoriesApi'
import type { Ingredient } from '../ingredients/ingredientsApi'

export type Product = {
  id: number
  category_id: number
  name: string
  description: string | null
  price: string
  image_url: string | null
  available: boolean
}

export type ProductDetail = Product & {
  category: Category
  ingredients: Ingredient[]
}

export type ProductPayload = {
  category_id: number
  name: string
  description: string | null
  price: string
  image_url: string | null
  available: boolean
  ingredient_ids: number[]
}

export async function getProductsWithDetails(): Promise<ProductDetail[]> {
  return apiFetch<ProductDetail[]>('/products/details')
}

export async function createProduct(payload: ProductPayload, token: string): Promise<Product> {
  return apiFetch<Product>('/products/', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateProduct(
  productId: number,
  payload: Partial<ProductPayload>,
  token: string,
): Promise<Product> {
  return apiFetch<Product>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteProduct(productId: number, token: string): Promise<void> {
  return apiFetch<void>(`/products/${productId}`, {
    method: 'DELETE',
    token,
  })
}

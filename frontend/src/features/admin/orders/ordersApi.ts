import { apiFetch } from '../../../lib/api'
import type { Ingredient } from '../ingredients/ingredientsApi'
import type { Product } from '../products/productsApi'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type Location = {
  id: number
  user_id: number
  location: string
  city: string
  indications: string | null
  is_principal: boolean
  create_date: string
}

export type Shipping = {
  id: number
  order_id: number
  delivery_person_id: number
  status: string
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export type OrderItemIngredient = {
  ingredient_id: number
  additional_price: string
  order_item_id: number
  ingredient: Ingredient
}

export type OrderItem = {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: string
  notes: string | null
  product: Product
  ingredients: OrderItemIngredient[]
}

export type OrderDetail = {
  id: number
  user_id: number
  location_id: number | null
  status: OrderStatus
  total: string
  notes: string | null
  created_at: string
  updated_at: string
  location: Location | null
  items: OrderItem[]
  shipping: Shipping | null
}

export type OrderUpdatePayload = {
  status?: OrderStatus
  notes?: string | null
}

export async function getOrdersWithDetails(token: string): Promise<OrderDetail[]> {
  return apiFetch<OrderDetail[]>('/orders/details', { token })
}

export async function updateOrder(
  orderId: number,
  payload: OrderUpdatePayload,
  token: string,
): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

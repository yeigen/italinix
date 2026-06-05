import { apiFetch } from '../../lib/api'
import type { ProductDetail } from '../admin/products/productsApi'

export type Location = {
  id: number
  user_id: number
  location: string
  city: string
  indications: string | null
  is_principal: boolean
  create_date: string
}

export type LocationPayload = {
  user_id: number
  location: string
  city: string
  indications: string | null
  is_principal: boolean
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

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
  items: Array<{
    id: number
    order_id: number
    product_id: number
    quantity: number
    unit_price: string
    notes: string | null
    product: ProductDetail
    ingredients: Array<{
      ingredient_id: number
      additional_price: string
      order_item_id: number
      ingredient: ProductDetail['ingredients'][number]
    }>
  }>
  shipping: {
    id: number
    order_id: number
    delivery_person_id: number
    status: string
    delivered_at: string | null
    created_at: string
    updated_at: string
  } | null
}

export type OrderPayload = {
  user_id: number
  location_id: number
  status: 'pending'
  total: string
  notes: string | null
  items: Array<{
    product_id: number
    quantity: number
    unit_price: string
    notes: string | null
    ingredients: Array<{
      ingredient_id: number
      additional_price: string
    }>
  }>
}

export async function getMenuProducts(): Promise<ProductDetail[]> {
  return apiFetch<ProductDetail[]>('/products/details')
}

export async function getUserLocations(userId: number, token: string): Promise<Location[]> {
  return apiFetch<Location[]>(`/locations/user/${userId}`, { token })
}

export async function createLocation(
  payload: LocationPayload,
  token: string,
): Promise<Location> {
  return apiFetch<Location>('/locations/', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateLocation(
  locationId: number,
  payload: Partial<LocationPayload>,
  token: string,
): Promise<Location> {
  return apiFetch<Location>(`/locations/${locationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteLocation(locationId: number, token: string): Promise<void> {
  return apiFetch<void>(`/locations/${locationId}`, {
    method: 'DELETE',
    token,
  })
}

export async function createOrder(payload: OrderPayload, token: string) {
  return apiFetch<OrderDetail>('/orders/', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function getUserOrders(userId: number, token: string): Promise<OrderDetail[]> {
  const orders = await apiFetch<Array<{ id: number }>>(`/orders/user/${userId}`, { token })
  return Promise.all(orders.map((order) => apiFetch<OrderDetail>(`/orders/${order.id}/details`, { token })))
}

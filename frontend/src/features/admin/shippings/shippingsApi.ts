import { apiFetch } from '../../../lib/api'

export type ShippingStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered'

export type Shipping = {
  id: number
  order_id: number
  delivery_person_id: number
  status: ShippingStatus
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export type ShippingPayload = {
  order_id: number
  delivery_person_id: number
  status: ShippingStatus
}

export type ShippingUpdatePayload = {
  delivery_person_id?: number
  status?: ShippingStatus
  delivered_at?: string | null
}

export async function getShippings(token: string): Promise<Shipping[]> {
  return apiFetch<Shipping[]>('/shippings/', { token })
}

export async function createShipping(
  payload: ShippingPayload,
  token: string,
): Promise<Shipping> {
  return apiFetch<Shipping>('/shippings/', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export async function updateShipping(
  shippingId: number,
  payload: ShippingUpdatePayload,
  token: string,
): Promise<Shipping> {
  return apiFetch<Shipping>(`/shippings/${shippingId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  })
}

export async function deleteShipping(shippingId: number, token: string): Promise<void> {
  return apiFetch<void>(`/shippings/${shippingId}`, {
    method: 'DELETE',
    token,
  })
}

import { apiFetch } from '../../lib/api'
import type { OrderDetail } from '../client/clientApi'

export type DeliveryStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered'

export type DeliveryShipping = {
  id: number
  order_id: number
  delivery_person_id: number
  status: DeliveryStatus
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export type DeliveryJob = {
  shipping: DeliveryShipping
  order: OrderDetail
}

export async function getDeliveryShippings(
  deliveryPersonId: number,
  token: string,
): Promise<DeliveryShipping[]> {
  return apiFetch<DeliveryShipping[]>(`/shippings/delivery-person/${deliveryPersonId}`, { token })
}

export async function getAssignedOrder(orderId: number, token: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${orderId}/details`, { token })
}

export async function updateDeliveryShipping(
  shippingId: number,
  status: DeliveryStatus,
  token: string,
): Promise<DeliveryShipping> {
  return apiFetch<DeliveryShipping>(`/shippings/${shippingId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null,
    }),
    token,
  })
}

export async function getDeliveryJobs(
  deliveryPersonId: number,
  token: string,
): Promise<DeliveryJob[]> {
  const shippings = await getDeliveryShippings(deliveryPersonId, token)
  const orders = await Promise.all(
    shippings.map((shipping) => getAssignedOrder(shipping.order_id, token)),
  )

  return shippings.map((shipping, index) => ({
    shipping,
    order: orders[index],
  }))
}

import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../../lib/api'
import { getOrdersWithDetails, type OrderDetail } from '../orders/ordersApi'
import { getUsers, type AdminUser } from '../users/usersApi'
import {
  createShipping,
  deleteShipping,
  getShippings,
  updateShipping,
  type Shipping,
  type ShippingStatus,
} from './shippingsApi'
import './ShippingsPanel.css'

type ShippingsPanelProps = {
  token: string
}

const shippingStatuses: { value: ShippingStatus; label: string }[] = [
  { value: 'assigned', label: 'Asignado' },
  { value: 'picked_up', label: 'Recogido' },
  { value: 'in_transit', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
]

const statusLabels = Object.fromEntries(
  shippingStatuses.map((status) => [status.value, status.label]),
) as Record<ShippingStatus, string>

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return 'Ese pedido ya tiene un envio asignado.'
  }

  if (error instanceof ApiError && error.status === 400) {
    return 'Revisa el pedido y el repartidor seleccionado.'
  }

  if (error instanceof ApiError && error.status === 403) {
    return 'No tienes permisos para administrar envios.'
  }

  return 'No pudimos completar la accion de envios.'
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(price))
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ShippingsPanel({ token }: ShippingsPanelProps) {
  const [shippings, setShippings] = useState<Shipping[]>([])
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orderId, setOrderId] = useState('')
  const [deliveryPersonId, setDeliveryPersonId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deliveryPeople = users.filter(
    (user) => user.rol === 'repartidor' && user.active,
  )
  const assignedOrderIds = new Set(shippings.map((shipping) => shipping.order_id))
  const unassignedOrders = orders.filter((order) => !assignedOrderIds.has(order.id))

  async function loadShippingData() {
    const [shippingsData, ordersData, usersData] = await Promise.all([
      getShippings(token),
      getOrdersWithDetails(token),
      getUsers(token),
    ])

    setShippings(shippingsData)
    setOrders(ordersData)
    setUsers(usersData)
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialData() {
      setIsLoading(true)
      setError(null)

      try {
        const [shippingsData, ordersData, usersData] = await Promise.all([
          getShippings(token),
          getOrdersWithDetails(token),
          getUsers(token),
        ])

        if (!ignore) {
          setShippings(shippingsData)
          setOrders(ordersData)
          setUsers(usersData)
        }
      } catch (loadError) {
        if (!ignore) {
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      ignore = true
    }
  }, [token])

  async function handleCreateShipping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      await createShipping(
        {
          order_id: Number(orderId),
          delivery_person_id: Number(deliveryPersonId),
          status: 'assigned',
        },
        token,
      )
      await loadShippingData()
      setOrderId('')
      setDeliveryPersonId('')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(shipping: Shipping, status: ShippingStatus) {
    setError(null)

    try {
      const payload = {
        status,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null,
      }

      const updatedShipping = await updateShipping(shipping.id, payload, token)
      setShippings((currentShippings) =>
        currentShippings.map((currentShipping) =>
          currentShipping.id === updatedShipping.id ? updatedShipping : currentShipping,
        ),
      )
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    }
  }

  async function handleDeliveryPersonChange(shipping: Shipping, selectedUserId: string) {
    setError(null)

    try {
      const updatedShipping = await updateShipping(
        shipping.id,
        { delivery_person_id: Number(selectedUserId) },
        token,
      )
      setShippings((currentShippings) =>
        currentShippings.map((currentShipping) =>
          currentShipping.id === updatedShipping.id ? updatedShipping : currentShipping,
        ),
      )
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    }
  }

  async function handleDelete(shipping: Shipping) {
    const order = orders.find((currentOrder) => currentOrder.id === shipping.order_id)
    const shouldDelete = window.confirm(
      `Eliminar envio de la orden #${order?.id ?? shipping.order_id}?`,
    )

    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deleteShipping(shipping.id, token)
      setShippings((currentShippings) =>
        currentShippings.filter((currentShipping) => currentShipping.id !== shipping.id),
      )
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  const canAssign = orderId.length > 0 && deliveryPersonId.length > 0

  return (
    <section id="envios" className="shippings-panel" aria-labelledby="shippings-title">
      <div className="shippings-panel__header">
        <div>
          <p className="admin-kicker">Logistica</p>
          <h2 id="shippings-title">Envios</h2>
        </div>
        <span>{shippings.length} asignados</span>
      </div>

      {error && <p className="shippings-error">{error}</p>}

      <div className="shippings-panel__grid">
        <form className="shipping-form" onSubmit={handleCreateShipping}>
          <h3>Asignar pedido</h3>

          <label>
            Pedido sin envio
            <select
              required
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
            >
              <option value="">Selecciona un pedido</option>
              {unassignedOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  Orden #{order.id} - {formatPrice(order.total)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Repartidor
            <select
              required
              value={deliveryPersonId}
              onChange={(event) => setDeliveryPersonId(event.target.value)}
            >
              <option value="">Selecciona un repartidor</option>
              {deliveryPeople.map((deliveryPerson) => (
                <option key={deliveryPerson.id} value={deliveryPerson.id}>
                  {deliveryPerson.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={!canAssign || isSaving}>
            {isSaving ? 'Asignando...' : 'Asignar envio'}
          </button>

          {!isLoading && unassignedOrders.length === 0 && (
            <p>Todos los pedidos tienen envio asignado.</p>
          )}
        </form>

        <div className="shippings-list">
          {isLoading && <p className="shippings-empty">Cargando envios...</p>}

          {!isLoading && shippings.length === 0 && (
            <p className="shippings-empty">Aun no hay envios asignados.</p>
          )}

          {!isLoading &&
            shippings.map((shipping) => {
              const order = orders.find((currentOrder) => currentOrder.id === shipping.order_id)
              const deliveryPerson = users.find(
                (user) => user.id === shipping.delivery_person_id,
              )

              return (
                <article key={shipping.id} className="shipping-card">
                  <header>
                    <div>
                      <span className={`shipping-status shipping-status--${shipping.status}`}>
                        {statusLabels[shipping.status]}
                      </span>
                      <h3>Orden #{shipping.order_id}</h3>
                    </div>
                    <strong>{order ? formatPrice(order.total) : 'Sin total'}</strong>
                  </header>

                  <div className="shipping-card__body">
                    <p>
                      {order?.location
                        ? `${order.location.location}, ${order.location.city}`
                        : 'Sin direccion asociada'}
                    </p>
                    <small>Entregado: {formatDate(shipping.delivered_at)}</small>
                  </div>

                  <div className="shipping-card__controls">
                    <label>
                      Repartidor
                      <select
                        value={shipping.delivery_person_id}
                        onChange={(event) =>
                          handleDeliveryPersonChange(shipping, event.target.value)
                        }
                      >
                        {deliveryPeople.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Estado
                      <select
                        value={shipping.status}
                        onChange={(event) =>
                          handleStatusChange(shipping, event.target.value as ShippingStatus)
                        }
                      >
                        {shippingStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <footer>
                    <span>{deliveryPerson?.email ?? 'Repartidor no encontrado'}</span>
                    <button type="button" onClick={() => handleDelete(shipping)}>
                      Eliminar
                    </button>
                  </footer>
                </article>
              )
            })}
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../../lib/api'
import { getOrdersWithDetails, updateOrder, type OrderDetail, type OrderStatus } from './ordersApi'
import './OrdersPanel.css'

type OrdersPanelProps = {
  token: string
}

const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'preparing', label: 'En preparacion' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const statusLabels = Object.fromEntries(
  orderStatuses.map((status) => [status.value, status.label]),
) as Record<OrderStatus, string>

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return 'No tienes permisos para modificar pedidos.'
  }

  return 'No pudimos cargar o actualizar los pedidos.'
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(price))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function OrdersPanel({ token }: OrdersPanelProps) {
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [status, setStatus] = useState<OrderStatus>('pending')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null

  useEffect(() => {
    let ignore = false

    async function loadOrders() {
      setIsLoading(true)
      setError(null)

      try {
        const ordersData = await getOrdersWithDetails(token)
        if (!ignore) {
          setOrders(ordersData)

          const firstOrder = ordersData[0]
          if (firstOrder) {
            setSelectedOrderId(firstOrder.id)
            setStatus(firstOrder.status)
            setNotes(firstOrder.notes ?? '')
          }
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

    loadOrders()

    return () => {
      ignore = true
    }
  }, [token])

  function handleSelectOrder(order: OrderDetail) {
    setSelectedOrderId(order.id)
    setStatus(order.status)
    setNotes(order.notes ?? '')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedOrder) {
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      await updateOrder(
        selectedOrder.id,
        {
          status,
          notes: notes.trim() || null,
        },
        token,
      )

      const updatedOrders = await getOrdersWithDetails(token)
      setOrders(updatedOrders)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section id="pedidos" className="orders-panel" aria-labelledby="orders-title">
      <div className="orders-panel__header">
        <div>
          <p className="admin-kicker">Operacion</p>
          <h2 id="orders-title">Pedidos</h2>
        </div>
        <span>{orders.length} ordenes</span>
      </div>

      {error && <p className="orders-error">{error}</p>}

      <div className="orders-panel__grid">
        <div className="orders-list" aria-label="Lista de pedidos">
          {isLoading && <p className="orders-empty">Cargando pedidos...</p>}

          {!isLoading && orders.length === 0 && (
            <p className="orders-empty">Aun no hay pedidos registrados.</p>
          )}

          {!isLoading &&
            orders.map((order) => (
              <button
                type="button"
                key={order.id}
                className={order.id === selectedOrderId ? 'order-row order-row--active' : 'order-row'}
                onClick={() => handleSelectOrder(order)}
              >
                <span>Orden #{order.id}</span>
                <strong>{formatPrice(order.total)}</strong>
                <small>{statusLabels[order.status]}</small>
              </button>
            ))}
        </div>

        <article className="order-detail">
          {!selectedOrder && <p className="orders-empty">Selecciona un pedido para ver detalles.</p>}

          {selectedOrder && (
            <>
              <header className="order-detail__header">
                <div>
                  <p className="admin-kicker">Orden #{selectedOrder.id}</p>
                  <h3>{formatPrice(selectedOrder.total)}</h3>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                </div>
                <strong className={`order-status order-status--${selectedOrder.status}`}>
                  {statusLabels[selectedOrder.status]}
                </strong>
              </header>

              <div className="order-detail__section">
                <h4>Entrega</h4>
                {selectedOrder.location ? (
                  <p>
                    {selectedOrder.location.location}, {selectedOrder.location.city}
                    {selectedOrder.location.indications
                      ? ` - ${selectedOrder.location.indications}`
                      : ''}
                  </p>
                ) : (
                  <p>Sin direccion asociada.</p>
                )}
                <small>
                  Envio:{' '}
                  {selectedOrder.shipping ? selectedOrder.shipping.status : 'sin asignar'}
                </small>
              </div>

              <div className="order-detail__section">
                <h4>Productos</h4>
                <div className="order-items">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <div>
                        <strong>
                          {item.quantity} x {item.product.name}
                        </strong>
                        <span>{formatPrice(item.unit_price)}</span>
                      </div>
                      {item.notes && <p>{item.notes}</p>}
                      <div className="order-item__ingredients">
                        {item.ingredients.length === 0 && <span>Sin adicionales</span>}
                        {item.ingredients.map((ingredient) => (
                          <span key={`${item.id}-${ingredient.ingredient_id}`}>
                            {ingredient.ingredient.name} +{formatPrice(ingredient.additional_price)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form className="order-update" onSubmit={handleSubmit}>
                <h4>Actualizar pedido</h4>
                <label>
                  Estado
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as OrderStatus)}
                  >
                    {orderStatuses.map((orderStatus) => (
                      <option key={orderStatus.value} value={orderStatus.value}>
                        {orderStatus.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Notas
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Notas internas o actualizaciones del pedido"
                  />
                </label>

                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar pedido'}
                </button>
              </form>
            </>
          )}
        </article>
      </div>
    </section>
  )
}

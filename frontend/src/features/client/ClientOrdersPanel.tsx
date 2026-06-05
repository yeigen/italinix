import { useState, type FormEvent } from 'react'
import { createOrder, type Location, type OrderDetail } from './clientApi'
import { formatCurrency, getCartTotal, type CartItem } from './clientTypes'
import './ClientOrdersPanel.css'

type ClientOrdersPanelProps = {
  userId: number
  token: string
  cartItems: CartItem[]
  locations: Location[]
  orders: OrderDetail[]
  onOrderCreated: (order: OrderDetail) => void
  onClearCart: () => void
}

const statusLabels: Record<OrderDetail['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparacion',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ClientOrdersPanel({
  userId,
  token,
  cartItems,
  locations,
  orders,
  onOrderCreated,
  onClearCart,
}: ClientOrdersPanelProps) {
  const [locationId, setLocationId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = getCartTotal(cartItems)

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const order = await createOrder(
        {
          user_id: userId,
          location_id: Number(locationId),
          status: 'pending',
          total: total.toFixed(2),
          notes: notes.trim() || null,
          items: cartItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: Number(item.product.price).toFixed(2),
            notes: item.notes || null,
            ingredients: item.product.ingredients
              .filter((ingredient) => item.ingredientIds.includes(ingredient.id))
              .map((ingredient) => ({
                ingredient_id: ingredient.id,
                additional_price: Number(ingredient.additional_price).toFixed(2),
              })),
          })),
        },
        token,
      )

      onOrderCreated(order)
      onClearCart()
      setLocationId('')
      setNotes('')
    } catch {
      setError('No pudimos crear el pedido. Revisa carrito y direccion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="pedidos" className="client-orders" aria-labelledby="orders-title">
      <div className="client-section-heading">
        <p className="client-kicker">Checkout</p>
        <h2 id="orders-title">Confirma y sigue tus pedidos</h2>
      </div>

      {error && <p className="client-alert">{error}</p>}

      <div className="client-orders__grid">
        <form className="client-checkout" onSubmit={handleCheckout}>
          <h3>Resumen</h3>
          <strong>{formatCurrency(total)}</strong>
          <p>{cartItems.length} productos en carrito</p>

          <label>
            Direccion de entrega
            <select required value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="">Selecciona una direccion</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.location}, {location.city}
                </option>
              ))}
            </select>
          </label>

          <label>
            Notas del pedido
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Indicaciones generales para cocina o entrega"
            />
          </label>

          <button type="submit" disabled={isSubmitting || cartItems.length === 0 || locations.length === 0}>
            {isSubmitting ? 'Creando pedido...' : 'Crear pedido'}
          </button>
        </form>

        <div className="client-order-list">
          {orders.length === 0 && <p className="client-empty">Aun no tienes pedidos.</p>}
          {orders.map((order) => (
            <article key={order.id} className="client-order-card">
              <header>
                <div>
                  <span>{statusLabels[order.status]}</span>
                  <h3>Pedido #{order.id}</h3>
                </div>
                <strong>{formatCurrency(order.total)}</strong>
              </header>
              <p>{order.location ? `${order.location.location}, ${order.location.city}` : 'Sin direccion'}</p>
              <small>{formatDate(order.created_at)}</small>
              <div>
                {order.items.map((item) => (
                  <span key={item.id}>
                    {item.quantity} x {item.product.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

import { useState, type FormEvent } from 'react'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { createOrder, type Location, type OrderDetail } from './clientApi'
import { formatCurrency, getCartItemUnitTotal, getCartTotal, type CartItem } from './clientTypes'
import './ClientCheckoutPanel.css'

type ClientCheckoutPanelProps = {
  userId: number
  token: string
  cartItems: CartItem[]
  locations: Location[]
  onOrderCreated: (order: OrderDetail) => void
  onClearCart: () => void
  onGoToMenu: () => void
  onGoToAddresses: () => void
}

export function ClientCheckoutPanel({
  userId,
  token,
  cartItems,
  locations,
  onOrderCreated,
  onClearCart,
  onGoToMenu,
  onGoToAddresses,
}: ClientCheckoutPanelProps) {
  const [locationId, setLocationId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = getCartTotal(cartItems)
  const selectedLocation = locations.find((location) => location.id === Number(locationId))

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
    <section id="checkout" className="client-checkout-section" aria-labelledby="checkout-title">
      <SectionHeader
        kicker="Checkout"
        title="Revisa tu pedido antes de enviarlo"
        titleId="checkout-title"
        description="Valida direccion, productos, notas y total antes de enviarlo a cocina."
      />

      {error && <p className="client-alert">{error}</p>}

      <form className="client-checkout-flow" onSubmit={handleCheckout}>
        <div className="client-checkout-main">
          <section className="checkout-block" aria-labelledby="checkout-address-title">
            <div className="checkout-block__heading">
              <span>01</span>
              <div>
                <h3 id="checkout-address-title">Direccion de entrega</h3>
                <p>Selecciona donde quieres recibir tu pedido.</p>
              </div>
            </div>

            {locations.length === 0 ? (
              <button className="checkout-inline-link" type="button" onClick={onGoToAddresses}>
                Agrega una direccion antes de continuar
              </button>
            ) : (
              <label>
                Direccion guardada
                <select
                  required
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                >
                  <option value="">Selecciona una direccion</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.location}, {location.city}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {selectedLocation && (
              <div className="checkout-address-preview">
                <strong>{selectedLocation.location}</strong>
                <span>{selectedLocation.city}</span>
                <small>{selectedLocation.indications || 'Sin indicaciones adicionales'}</small>
              </div>
            )}
          </section>

          <section className="checkout-block" aria-labelledby="checkout-items-title">
            <div className="checkout-block__heading">
              <span>02</span>
              <div>
                <h3 id="checkout-items-title">Resumen de productos</h3>
                <p>Confirma cantidades, adicionales y notas antes de enviar.</p>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <button className="checkout-inline-link" type="button" onClick={onGoToMenu}>
                Tu carrito esta vacio. Vuelve al menu
              </button>
            ) : (
              <div className="checkout-items">
                {cartItems.map((item) => {
                  const selectedIngredients = item.product.ingredients.filter((ingredient) =>
                    item.ingredientIds.includes(ingredient.id),
                  )
                  const unitTotal = getCartItemUnitTotal(item)

                  return (
                    <article key={item.id} className="checkout-item">
                      <div>
                        <h4>{item.product.name}</h4>
                        <p>{item.quantity} unidad(es)</p>
                      </div>
                      <div>
                        {selectedIngredients.length > 0 && (
                          <small>
                            Adicionales: {selectedIngredients.map((ingredient) => ingredient.name).join(', ')}
                          </small>
                        )}
                        {item.notes && <small>Notas: {item.notes}</small>}
                      </div>
                      <strong>{formatCurrency(unitTotal * item.quantity)}</strong>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="checkout-block" aria-labelledby="checkout-notes-title">
            <div className="checkout-block__heading">
              <span>03</span>
              <div>
                <h3 id="checkout-notes-title">Notas del pedido</h3>
                <p>Indicaciones generales para cocina o entrega.</p>
              </div>
            </div>

            <label>
              Notas opcionales
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ej: llamar al llegar, entregar en recepcion..."
              />
            </label>
          </section>
        </div>

        <aside className="checkout-summary" aria-label="Total del pedido">
          <p className="client-kicker">Total</p>
          <strong>{formatCurrency(total)}</strong>
          <div>
            <span>Productos</span>
            <span>{cartItems.length}</span>
          </div>
          <div>
            <span>Direccion</span>
            <span>{selectedLocation ? 'Lista' : 'Pendiente'}</span>
          </div>
          <button type="submit" disabled={isSubmitting || cartItems.length === 0 || locations.length === 0}>
            {isSubmitting ? 'Creando pedido...' : 'Confirmar pedido'}
          </button>
        </aside>
      </form>
    </section>
  )
}

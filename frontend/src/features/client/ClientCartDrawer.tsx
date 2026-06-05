import { Drawer } from '../../components/ui/Drawer'
import { formatCurrency, getCartItemUnitTotal, getCartTotal, type CartItem } from './clientTypes'
import './ClientCartDrawer.css'

type ClientCartDrawerProps = {
  isOpen: boolean
  cartItems: CartItem[]
  onClose: () => void
  onCheckoutClick: () => void
  onRemoveItem: (itemId: string) => void
  onChangeQuantity: (itemId: string, quantity: number) => void
}

export function ClientCartDrawer({
  isOpen,
  cartItems,
  onClose,
  onCheckoutClick,
  onRemoveItem,
  onChangeQuantity,
}: ClientCartDrawerProps) {
  const total = getCartTotal(cartItems)

  return (
    <Drawer title="Tu carrito" isOpen={isOpen} onClose={onClose}>
      <div className="client-cart-drawer">
        {cartItems.length === 0 && (
          <div className="client-cart-drawer__empty">
            <h3>Tu carrito esta vacio</h3>
            <p>Agrega una pizza, pasta o antipasti para empezar tu pedido.</p>
          </div>
        )}

        <div className="client-cart-drawer__items">
          {cartItems.map((item) => {
            const unitTotal = getCartItemUnitTotal(item)
            const selectedIngredients = item.product.ingredients.filter((ingredient) =>
              item.ingredientIds.includes(ingredient.id),
            )

            return (
              <article key={item.id} className="client-cart-drawer__item">
                <div>
                  <h3>{item.product.name}</h3>
                  <strong>{formatCurrency(unitTotal * item.quantity)}</strong>
                </div>
                <p>{formatCurrency(unitTotal)} unidad</p>
                {selectedIngredients.length > 0 && (
                  <small>{selectedIngredients.map((ingredient) => ingredient.name).join(', ')}</small>
                )}
                {item.notes && <small>{item.notes}</small>}

                <div className="client-cart-drawer__actions">
                  <label>
                    Cantidad
                    <input
                      min="1"
                      type="number"
                      value={item.quantity}
                      onChange={(event) => onChangeQuantity(item.id, Number(event.target.value))}
                    />
                  </label>
                  <button type="button" onClick={() => onRemoveItem(item.id)}>
                    Quitar
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <footer className="client-cart-drawer__footer">
          <div>
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <button type="button" onClick={onCheckoutClick} disabled={cartItems.length === 0}>
            Ir a checkout
          </button>
        </footer>
      </div>
    </Drawer>
  )
}

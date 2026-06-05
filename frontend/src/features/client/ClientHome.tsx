import { useEffect, useState } from 'react'
import type { AuthUser } from '../auth/types'
import { ClientAddressesPanel } from './ClientAddressesPanel'
import { ClientCartDrawer } from './ClientCartDrawer'
import { ClientMenuPanel } from './ClientMenuPanel'
import { ClientOrdersPanel } from './ClientOrdersPanel'
import { getUserLocations, getUserOrders, type Location, type OrderDetail } from './clientApi'
import { formatCurrency, getCartTotal, type CartItem } from './clientTypes'
import './ClientHome.css'

type ClientHomeProps = {
  user: AuthUser
  token: string
  onLogout: () => void
}

export function ClientHome({ user, token, onLogout }: ClientHomeProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadClientData() {
      setError(null)

      try {
        const [locationsData, ordersData] = await Promise.all([
          getUserLocations(user.id, token),
          getUserOrders(user.id, token),
        ])

        if (!ignore) {
          setLocations(locationsData)
          setOrders(ordersData)
        }
      } catch {
        if (!ignore) {
          setError('No pudimos cargar tus direcciones o pedidos.')
        }
      }
    }

    loadClientData()

    return () => {
      ignore = true
    }
  }, [token, user.id])

  function addCartItem(item: CartItem) {
    setCartItems((currentItems) => [...currentItems, item])
    setIsCartOpen(true)
  }

  function removeCartItem(itemId: string) {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
  }

  function changeCartItemQuantity(itemId: string, quantity: number) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(1, quantity || 1) } : item,
      ),
    )
  }

  return (
    <main className="client-home">
      <header className="client-header">
        <a href="#inicio" className="client-header__brand">
          Italinix
        </a>
        <nav aria-label="Cliente">
          <a href="#menu">Menu</a>
          <a href="#direcciones">Direcciones</a>
          <a href="#pedidos">Mis pedidos</a>
        </nav>
        <div className="client-header__actions">
          <button type="button" className="client-cart-button" onClick={() => setIsCartOpen(true)}>
            Carrito
            {cartItems.length > 0 && <span>{cartItems.length}</span>}
          </button>
          <button type="button" onClick={onLogout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <section id="inicio" className="client-hero">
        <p className="client-kicker">Hola, {user.name}</p>
        <h1>Tu proximo pedido italiano empieza aqui.</h1>
        <p>
          Explora el menu, guarda tu direccion y confirma tu pedido con seguimiento desde
          cocina hasta entrega.
        </p>
      </section>

      {error && <p className="client-home__error">{error}</p>}

      <ClientMenuPanel
        onAddItem={addCartItem}
      />

      <ClientAddressesPanel
        userId={user.id}
        token={token}
        locations={locations}
        onLocationsChange={setLocations}
      />

      <ClientOrdersPanel
        userId={user.id}
        token={token}
        cartItems={cartItems}
        locations={locations}
        orders={orders}
        onOrderCreated={(order) => setOrders((currentOrders) => [order, ...currentOrders])}
        onClearCart={() => setCartItems([])}
      />

      <button type="button" className="client-floating-cart" onClick={() => setIsCartOpen(true)}>
        <span>Carrito ({cartItems.length})</span>
        <strong>{formatCurrency(getCartTotal(cartItems))}</strong>
      </button>

      <ClientCartDrawer
        isOpen={isCartOpen}
        cartItems={cartItems}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={removeCartItem}
        onChangeQuantity={changeCartItemQuantity}
      />
    </main>
  )
}

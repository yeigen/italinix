import { useEffect, useState } from 'react'
import { AppShell, type ShellNavGroup } from '../../components/layout/AppShell'
import { CartIcon, MenuIcon, PinIcon, ReceiptIcon } from '../../components/layout/icons'
import { Badge } from '../../components/ui/Badge'
import type { AuthUser } from '../auth/types'
import { ClientAddressesPanel } from './ClientAddressesPanel'
import { ClientCartDrawer } from './ClientCartDrawer'
import { ClientCheckoutPanel } from './ClientCheckoutPanel'
import { ClientMenuPanel } from './ClientMenuPanel'
import { ClientOrderHistory } from './ClientOrderHistory'
import { getUserLocations, getUserOrders, type Location, type OrderDetail } from './clientApi'
import { formatCurrency, getCartTotal, type CartItem } from './clientTypes'
import './ClientHome.css'

type ClientView = 'menu' | 'direcciones' | 'checkout' | 'pedidos'

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
  const [activeView, setActiveView] = useState<ClientView>('menu')
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

  function goToCheckout() {
    setIsCartOpen(false)
    setActiveView('checkout')
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

  const clientNav: ShellNavGroup[] = [
    {
      items: [
        { id: 'menu', label: 'Menu', icon: <MenuIcon /> },
        { id: 'direcciones', label: 'Direcciones', icon: <PinIcon /> },
        { id: 'checkout', label: 'Checkout', icon: <CartIcon /> },
        { id: 'pedidos', label: 'Mis pedidos', icon: <ReceiptIcon /> },
      ],
    },
  ]

  const cartAction = (
    <button type="button" className="client-cart-trigger" onClick={() => setIsCartOpen(true)}>
      <CartIcon />
      <span className="client-cart-trigger__label">Carrito</span>
      <strong className="client-cart-trigger__total">{formatCurrency(getCartTotal(cartItems))}</strong>
      {cartItems.length > 0 && (
        <Badge tone="accent" count>
          {cartItems.length}
        </Badge>
      )}
    </button>
  )

  return (
    <>
      <AppShell
        brand="Italinix"
        roleLabel="Cliente"
        accent="client"
        nav={clientNav}
        activeId={activeView}
        onNavigate={(id) => setActiveView(id as ClientView)}
        user={{ name: user.name, email: user.email }}
        onLogout={onLogout}
        actions={cartAction}
      >
        {error && <p className="client-alert">{error}</p>}

        {activeView === 'menu' && <ClientMenuPanel onAddItem={addCartItem} />}

        {activeView === 'direcciones' && (
          <ClientAddressesPanel
            userId={user.id}
            token={token}
            locations={locations}
            onLocationsChange={setLocations}
          />
        )}

        {activeView === 'checkout' && (
          <ClientCheckoutPanel
            userId={user.id}
            token={token}
            cartItems={cartItems}
            locations={locations}
            onOrderCreated={(order) => {
              setOrders((currentOrders) => [order, ...currentOrders])
              setActiveView('pedidos')
            }}
            onClearCart={() => setCartItems([])}
            onGoToMenu={() => setActiveView('menu')}
            onGoToAddresses={() => setActiveView('direcciones')}
          />
        )}

        {activeView === 'pedidos' && <ClientOrderHistory orders={orders} />}
      </AppShell>

      <ClientCartDrawer
        isOpen={isCartOpen}
        cartItems={cartItems}
        onClose={() => setIsCartOpen(false)}
        onCheckoutClick={goToCheckout}
        onRemoveItem={removeCartItem}
        onChangeQuantity={changeCartItemQuantity}
      />
    </>
  )
}

import { useState } from 'react'
import { AppShell, type ShellNavGroup } from '../../components/layout/AppShell'
import {
  BoxIcon,
  ClipboardIcon,
  LeafIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
} from '../../components/layout/icons'
import type { AuthUser } from '../auth/types'
import { CategoriesPanel } from './categories/CategoriesPanel'
import { IngredientsPanel } from './ingredients/IngredientsPanel'
import { OrdersPanel } from './orders/OrdersPanel'
import { ProductsPanel } from './products/ProductsPanel'
import { ShippingsPanel } from './shippings/ShippingsPanel'
import { UsersPanel } from './users/UsersPanel'
import './AdminDashboard.css'

type AdminDashboardProps = {
  user: AuthUser
  token: string
  onLogout: () => void
}

type AdminView =
  | 'pedidos'
  | 'envios'
  | 'categorias'
  | 'ingredientes'
  | 'productos'
  | 'usuarios'

const adminNav: ShellNavGroup[] = [
  {
    label: 'Operacion',
    items: [
      { id: 'pedidos', label: 'Pedidos', icon: <ClipboardIcon /> },
      { id: 'envios', label: 'Envios', icon: <TruckIcon /> },
    ],
  },
  {
    label: 'Catalogo',
    items: [
      { id: 'categorias', label: 'Categorias', icon: <TagIcon /> },
      { id: 'ingredientes', label: 'Ingredientes', icon: <LeafIcon /> },
      { id: 'productos', label: 'Productos', icon: <BoxIcon /> },
    ],
  },
  {
    label: 'Equipo',
    items: [{ id: 'usuarios', label: 'Usuarios', icon: <UsersIcon /> }],
  },
]

export function AdminDashboard({ user, token, onLogout }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<AdminView>('pedidos')

  return (
    <AppShell
      brand="Italinix"
      roleLabel="Admin"
      accent="admin"
      nav={adminNav}
      activeId={activeView}
      onNavigate={(id) => setActiveView(id as AdminView)}
      user={{ name: user.name, email: user.email }}
      onLogout={onLogout}
    >
      {activeView === 'pedidos' && <OrdersPanel token={token} />}
      {activeView === 'envios' && <ShippingsPanel token={token} />}
      {activeView === 'categorias' && <CategoriesPanel token={token} />}
      {activeView === 'ingredientes' && <IngredientsPanel token={token} />}
      {activeView === 'productos' && <ProductsPanel token={token} />}
      {activeView === 'usuarios' && <UsersPanel token={token} currentUserId={user.id} />}
    </AppShell>
  )
}

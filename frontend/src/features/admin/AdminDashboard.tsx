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

const adminModules = [
  {
    title: 'Catalogo',
    description: 'Categorias, ingredientes y productos del menu.',
    metric: '3 areas',
  },
  {
    title: 'Pedidos',
    description: 'Seguimiento de ordenes desde cocina hasta entrega.',
    metric: 'Tiempo real',
  },
  {
    title: 'Envios',
    description: 'Asignacion y control de repartidores activos.',
    metric: 'Repartidores',
  },
  {
    title: 'Usuarios',
    description: 'Clientes, administradores y equipo de reparto.',
    metric: 'Roles',
  },
]

export function AdminDashboard({ user, token, onLogout }: AdminDashboardProps) {
  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar" aria-label="Navegacion admin">
        <div>
          <p className="admin-kicker">Italinix</p>
          <h1>Admin</h1>
        </div>

        <nav>
          <a href="#catalogo">Catalogo</a>
          <a href="#ingredientes">Ingredientes</a>
          <a href="#productos">Productos</a>
          <a href="#pedidos">Pedidos</a>
          <a href="#envios">Envios</a>
          <a href="#usuarios">Usuarios</a>
        </nav>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Panel administrativo</p>
            <h2>Buen servicio empieza con una cocina organizada.</h2>
          </div>

          <div className="admin-session">
            <span>{user.name}</span>
            <small>{user.email}</small>
            <button type="button" onClick={onLogout}>
              Cerrar sesion
            </button>
          </div>
        </header>

        <section className="admin-summary" aria-label="Resumen operativo">
          <article>
            <span>Menu</span>
            <strong>Listo para editar</strong>
          </article>
          <article>
            <span>Pedidos</span>
            <strong>Conectado</strong>
          </article>
          <article>
            <span>Envios</span>
            <strong>Conectado</strong>
          </article>
        </section>

        <section className="admin-modules" aria-label="Modulos admin">
          {adminModules.map((module) => (
            <article key={module.title} className="admin-module-card">
              <span>{module.metric}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </section>

        <CategoriesPanel token={token} />
        <IngredientsPanel token={token} />
        <ProductsPanel token={token} />
        <OrdersPanel token={token} />
        <ShippingsPanel token={token} />
        <UsersPanel token={token} currentUserId={user.id} />
      </section>
    </main>
  )
}

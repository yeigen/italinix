import { useEffect, useState } from 'react'
import type { AuthUser } from '../auth/types'
import {
  getDeliveryJobs,
  updateDeliveryShipping,
  type DeliveryJob,
  type DeliveryStatus,
} from './deliveryApi'
import { formatCurrency } from '../client/clientTypes'
import './DeliveryDashboard.css'

type DeliveryDashboardProps = {
  user: AuthUser
  token: string
  onLogout: () => void
}

const statusLabels: Record<DeliveryStatus, string> = {
  assigned: 'Asignado',
  picked_up: 'Recogido',
  in_transit: 'En camino',
  delivered: 'Entregado',
}

const statusOptions: { value: DeliveryStatus; label: string }[] = [
  { value: 'assigned', label: 'Asignado' },
  { value: 'picked_up', label: 'Recogido' },
  { value: 'in_transit', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
]

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function DeliveryDashboard({ user, token, onLogout }: DeliveryDashboardProps) {
  const [jobs, setJobs] = useState<DeliveryJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadJobs() {
      setIsLoading(true)
      setError(null)

      try {
        const jobsData = await getDeliveryJobs(user.id, token)
        if (!ignore) {
          setJobs(jobsData)
        }
      } catch {
        if (!ignore) {
          setError('No pudimos cargar tus envios asignados.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadJobs()

    return () => {
      ignore = true
    }
  }, [token, user.id])

  async function handleStatusChange(job: DeliveryJob, status: DeliveryStatus) {
    setError(null)

    try {
      const updatedShipping = await updateDeliveryShipping(job.shipping.id, status, token)
      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.shipping.id === updatedShipping.id
            ? { ...currentJob, shipping: updatedShipping }
            : currentJob,
        ),
      )
    } catch {
      setError('No pudimos actualizar el estado del envio.')
    }
  }

  const activeJobs = jobs.filter((job) => job.shipping.status !== 'delivered')
  const deliveredJobs = jobs.filter((job) => job.shipping.status === 'delivered')

  return (
    <main className="delivery-dashboard">
      <header className="delivery-header">
        <a href="#envios" className="delivery-header__brand">
          Italinix
        </a>
        <nav aria-label="Repartidor">
          <a href="#envios">Envios</a>
          <a href="#entregados">Entregados</a>
        </nav>
        <button type="button" onClick={onLogout}>
          Cerrar sesion
        </button>
      </header>

      <section className="delivery-hero">
        <p className="delivery-kicker">Repartidor</p>
        <h1>Hola, {user.name}. Estos son tus envios.</h1>
        <div className="delivery-metrics">
          <span>{activeJobs.length} activos</span>
          <span>{deliveredJobs.length} entregados</span>
        </div>
      </section>

      {error && <p className="delivery-alert">{error}</p>}

      <section id="envios" className="delivery-section" aria-labelledby="active-deliveries-title">
        <div className="delivery-section__heading">
          <p className="delivery-kicker">Ruta</p>
          <h2 id="active-deliveries-title">Envios asignados</h2>
        </div>

        {isLoading && <p className="delivery-empty">Cargando envios...</p>}
        {!isLoading && activeJobs.length === 0 && (
          <p className="delivery-empty">No tienes envios activos.</p>
        )}

        <div className="delivery-grid">
          {activeJobs.map((job) => (
            <DeliveryCard key={job.shipping.id} job={job} onStatusChange={handleStatusChange} />
          ))}
        </div>
      </section>

      <section id="entregados" className="delivery-section" aria-labelledby="delivered-title">
        <div className="delivery-section__heading">
          <p className="delivery-kicker">Historial</p>
          <h2 id="delivered-title">Entregados</h2>
        </div>

        {!isLoading && deliveredJobs.length === 0 && (
          <p className="delivery-empty">Aun no tienes entregas completadas.</p>
        )}

        <div className="delivery-grid">
          {deliveredJobs.map((job) => (
            <DeliveryCard key={job.shipping.id} job={job} onStatusChange={handleStatusChange} />
          ))}
        </div>
      </section>
    </main>
  )
}

function DeliveryCard({
  job,
  onStatusChange,
}: {
  job: DeliveryJob
  onStatusChange: (job: DeliveryJob, status: DeliveryStatus) => void
}) {
  const { order, shipping } = job

  return (
    <article className="delivery-card">
      <header>
        <div>
          <span className={`delivery-status delivery-status--${shipping.status}`}>
            {statusLabels[shipping.status]}
          </span>
          <h3>Pedido #{order.id}</h3>
        </div>
        <strong>{formatCurrency(order.total)}</strong>
      </header>

      <section className="delivery-card__address">
        <h4>Direccion</h4>
        <p>{order.location ? `${order.location.location}, ${order.location.city}` : 'Sin direccion'}</p>
        {order.location?.indications && <small>{order.location.indications}</small>}
      </section>

      <section className="delivery-card__items">
        <h4>Productos</h4>
        {order.items.map((item) => (
          <div key={item.id}>
            <strong>
              {item.quantity} x {item.product.name}
            </strong>
            {item.ingredients.length > 0 && (
              <small>
                {item.ingredients.map((ingredient) => ingredient.ingredient.name).join(', ')}
              </small>
            )}
          </div>
        ))}
      </section>

      <label>
        Estado del envio
        <select
          value={shipping.status}
          onChange={(event) => onStatusChange(job, event.target.value as DeliveryStatus)}
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <footer>
        <span>Asignado: {formatDate(shipping.created_at)}</span>
        <span>Entregado: {formatDate(shipping.delivered_at)}</span>
      </footer>
    </article>
  )
}

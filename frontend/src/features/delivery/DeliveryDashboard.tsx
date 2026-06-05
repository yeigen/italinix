import { useEffect, useState } from 'react'
import { AppShell, type ShellNavGroup } from '../../components/layout/AppShell'
import { BoxIcon, TruckIcon } from '../../components/layout/icons'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
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

type DeliveryView = 'activos' | 'entregados'

const statusLabels: Record<DeliveryStatus, string> = {
  assigned: 'Asignado',
  picked_up: 'Recogido',
  in_transit: 'En camino',
  delivered: 'Entregado',
}

const statusTones: Record<DeliveryStatus, 'warning' | 'info' | 'success'> = {
  assigned: 'warning',
  picked_up: 'info',
  in_transit: 'info',
  delivered: 'success',
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
  const [activeView, setActiveView] = useState<DeliveryView>('activos')

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
  const visibleJobs = activeView === 'activos' ? activeJobs : deliveredJobs

  const deliveryNav: ShellNavGroup[] = [
    {
      items: [
        { id: 'activos', label: 'Envios activos', icon: <TruckIcon />, badge: activeJobs.length },
        { id: 'entregados', label: 'Entregados', icon: <BoxIcon /> },
      ],
    },
  ]

  const heading =
    activeView === 'activos'
      ? { kicker: 'Ruta', title: 'Envios asignados', desc: 'Actualiza el estado de cada envio en tu ruta.' }
      : { kicker: 'Historial', title: 'Entregados', desc: 'Tus entregas completadas.' }

  return (
    <AppShell
      brand="Italinix"
      roleLabel="Repartidor"
      accent="delivery"
      nav={deliveryNav}
      activeId={activeView}
      onNavigate={(id) => setActiveView(id as DeliveryView)}
      user={{ name: user.name, email: user.email }}
      onLogout={onLogout}
    >
      <SectionHeader
        kicker={heading.kicker}
        title={heading.title}
        description={heading.desc}
        actions={
          <Badge tone={activeView === 'activos' ? 'info' : 'success'}>
            {visibleJobs.length} {activeView === 'activos' ? 'activos' : 'entregados'}
          </Badge>
        }
      />

      {error && <p className="delivery-alert">{error}</p>}

      {isLoading && <p className="delivery-loading">Cargando envios...</p>}

      {!isLoading && visibleJobs.length === 0 && (
        <EmptyState
          icon={activeView === 'activos' ? <TruckIcon /> : <BoxIcon />}
          title={activeView === 'activos' ? 'No tienes envios activos' : 'Aun no tienes entregas completadas'}
          description={
            activeView === 'activos'
              ? 'Cuando te asignen un envio aparecera aqui.'
              : 'Las entregas que completes se moveran a esta vista.'
          }
        />
      )}

      <div className="delivery-grid">
        {visibleJobs.map((job) => (
          <DeliveryCard key={job.shipping.id} job={job} onStatusChange={handleStatusChange} />
        ))}
      </div>
    </AppShell>
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
          <Badge tone={statusTones[shipping.status]}>{statusLabels[shipping.status]}</Badge>
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

      <label className="delivery-card__status">
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

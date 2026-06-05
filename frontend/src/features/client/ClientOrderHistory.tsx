import { SectionHeader } from '../../components/layout/SectionHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import type { OrderDetail } from './clientApi'
import { formatCurrency } from './clientTypes'
import './ClientOrderHistory.css'

type ClientOrderHistoryProps = {
  orders: OrderDetail[]
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

export function ClientOrderHistory({ orders }: ClientOrderHistoryProps) {
  return (
    <section id="pedidos" className="client-order-history" aria-labelledby="history-title">
      <SectionHeader
        kicker="Historial"
        title="Tus pedidos"
        titleId="history-title"
        description="Revisa estados, productos y direcciones de tus compras anteriores."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="Aun no tienes pedidos"
          description="Cuando confirmes tu primer pedido aparecera aqui."
        />
      ) : (
        <div className="client-history-table-wrap">
          <table className="client-history-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Direccion</th>
                <th>Productos</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Pedido">#{order.id}</td>
                  <td data-label="Estado">
                    <span className={`client-history-status client-history-status--${order.status}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td data-label="Fecha">{formatDate(order.created_at)}</td>
                  <td data-label="Direccion">
                    {order.location ? `${order.location.location}, ${order.location.city}` : 'Sin direccion'}
                  </td>
                  <td data-label="Productos">
                    <div className="client-history-items">
                      {order.items.map((item) => (
                        <span key={item.id}>
                          {item.quantity} x {item.product.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td data-label="Total">
                    <strong>{formatCurrency(order.total)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

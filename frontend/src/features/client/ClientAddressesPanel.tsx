import { useState, type FormEvent } from 'react'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  createLocation,
  deleteLocation,
  updateLocation,
  type Location,
} from './clientApi'
import './ClientAddressesPanel.css'

type ClientAddressesPanelProps = {
  userId: number
  token: string
  locations: Location[]
  onLocationsChange: (locations: Location[]) => void
}

type AddressForm = {
  location: string
  city: string
  indications: string
  isPrincipal: boolean
}

const emptyForm: AddressForm = {
  location: '',
  city: '',
  indications: '',
  isPrincipal: false,
}

export function ClientAddressesPanel({
  userId,
  token,
  locations,
  onLocationsChange,
}: ClientAddressesPanelProps) {
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const payload = {
      user_id: userId,
      location: form.location.trim(),
      city: form.city.trim(),
      indications: form.indications.trim() || null,
      is_principal: form.isPrincipal,
    }

    try {
      if (editingLocation) {
        const updatedLocation = await updateLocation(editingLocation.id, payload, token)
        onLocationsChange(
          locations.map((location) =>
            location.id === updatedLocation.id ? updatedLocation : location,
          ),
        )
      } else {
        const newLocation = await createLocation(payload, token)
        onLocationsChange([...locations, newLocation])
      }

      setForm(emptyForm)
      setEditingLocation(null)
    } catch {
      setError('No pudimos guardar la direccion.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(location: Location) {
    setEditingLocation(location)
    setForm({
      location: location.location,
      city: location.city,
      indications: location.indications ?? '',
      isPrincipal: location.is_principal,
    })
  }

  async function handleDelete(location: Location) {
    const shouldDelete = window.confirm(`Eliminar direccion "${location.location}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deleteLocation(location.id, token)
      onLocationsChange(locations.filter((currentLocation) => currentLocation.id !== location.id))
    } catch {
      setError('No pudimos eliminar la direccion.')
    }
  }

  return (
    <section id="direcciones" className="client-addresses" aria-labelledby="addresses-title">
      <SectionHeader
        kicker="Direcciones"
        title="Guarda tus puntos de entrega"
        titleId="addresses-title"
        description="Crea y actualiza las direcciones donde quieres recibir tus pedidos."
      />

      {error && <p className="client-alert">{error}</p>}

      <div className="client-addresses__grid">
        <form className="client-address-form" onSubmit={handleSubmit}>
          <h3>{editingLocation ? 'Editar direccion' : 'Nueva direccion'}</h3>
          <label>
            Direccion
            <input
              required
              type="text"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="Calle 123 #45-67"
            />
          </label>
          <label>
            Ciudad
            <input
              required
              type="text"
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              placeholder="Ciudad"
            />
          </label>
          <label>
            Indicaciones
            <textarea
              rows={3}
              value={form.indications}
              onChange={(event) => setForm({ ...form, indications: event.target.value })}
              placeholder="Apartamento, porteria, referencia..."
            />
          </label>
          <label className="client-check">
            <input
              type="checkbox"
              checked={form.isPrincipal}
              onChange={(event) => setForm({ ...form, isPrincipal: event.target.checked })}
            />
            Direccion principal
          </label>
          <div className="client-address-form__actions">
            {editingLocation && (
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setEditingLocation(null)
                  setForm(emptyForm)
                }}
              >
                Cancelar
              </button>
            )}
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar direccion'}
            </button>
          </div>
        </form>

        <div className="client-address-list">
          {locations.length === 0 && (
            <EmptyState
              compact
              title="Aun no tienes direcciones"
              description="Agrega tu primera direccion con el formulario."
            />
          )}
          {locations.map((location) => (
            <article key={location.id} className="client-address-card">
              <div>
                <h3>{location.location}</h3>
                <p>{location.city}</p>
                <small>{location.indications || 'Sin indicaciones'}</small>
                {location.is_principal && <span>Principal</span>}
              </div>
              <div>
                <button type="button" onClick={() => handleEdit(location)}>
                  Editar
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(location)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

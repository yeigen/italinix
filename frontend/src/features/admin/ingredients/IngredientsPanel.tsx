import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../../lib/api'
import {
  createIngredient,
  deleteIngredient,
  getIngredients,
  updateIngredient,
  type Ingredient,
} from './ingredientsApi'
import './IngredientsPanel.css'

type IngredientsPanelProps = {
  token: string
}

type IngredientFormState = {
  name: string
  additionalPrice: string
}

const emptyForm: IngredientFormState = {
  name: '',
  additionalPrice: '0.00',
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return 'No tienes permisos para modificar ingredientes.'
  }

  return 'No pudimos completar la accion. Intenta nuevamente.'
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(price))
}

export function IngredientsPanel({ token }: IngredientsPanelProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [form, setForm] = useState<IngredientFormState>(emptyForm)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadIngredients() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getIngredients()
        if (!ignore) {
          setIngredients(data)
        }
      } catch (loadError) {
        if (!ignore) {
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadIngredients()

    return () => {
      ignore = true
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    const payload = {
      name: form.name.trim(),
      additional_price: Number(form.additionalPrice || 0).toFixed(2),
    }

    try {
      if (editingIngredient) {
        const updatedIngredient = await updateIngredient(editingIngredient.id, payload, token)
        setIngredients((currentIngredients) =>
          currentIngredients.map((ingredient) =>
            ingredient.id === updatedIngredient.id ? updatedIngredient : ingredient,
          ),
        )
      } else {
        const newIngredient = await createIngredient(payload, token)
        setIngredients((currentIngredients) => [...currentIngredients, newIngredient])
      }

      setForm(emptyForm)
      setEditingIngredient(null)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(ingredient: Ingredient) {
    setEditingIngredient(ingredient)
    setForm({
      name: ingredient.name,
      additionalPrice: ingredient.additional_price,
    })
  }

  function handleCancelEdit() {
    setEditingIngredient(null)
    setForm(emptyForm)
  }

  async function handleDelete(ingredient: Ingredient) {
    const shouldDelete = window.confirm(`Eliminar ingrediente "${ingredient.name}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deleteIngredient(ingredient.id, token)
      setIngredients((currentIngredients) =>
        currentIngredients.filter((currentIngredient) => currentIngredient.id !== ingredient.id),
      )

      if (editingIngredient?.id === ingredient.id) {
        handleCancelEdit()
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  return (
    <section id="ingredientes" className="ingredients-panel" aria-labelledby="ingredients-title">
      <div className="ingredients-panel__header">
        <div>
          <p className="admin-kicker">Catalogo</p>
          <h2 id="ingredients-title">Ingredientes</h2>
        </div>
        <span>{ingredients.length} registrados</span>
      </div>

      <div className="ingredients-panel__grid">
        <form className="ingredient-form" onSubmit={handleSubmit}>
          <h3>{editingIngredient ? 'Editar ingrediente' : 'Nuevo ingrediente'}</h3>

          <label>
            Nombre
            <input
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Extra queso"
              required
              type="text"
              value={form.name}
            />
          </label>

          <label>
            Precio adicional
            <input
              min="0"
              onChange={(event) =>
                setForm({ ...form, additionalPrice: event.target.value })
              }
              step="0.01"
              type="number"
              value={form.additionalPrice}
            />
          </label>

          {error && <p className="ingredient-error">{error}</p>}

          <div className="ingredient-form__actions">
            {editingIngredient && (
              <button type="button" className="button-secondary" onClick={handleCancelEdit}>
                Cancelar
              </button>
            )}
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : editingIngredient ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>

        <div className="ingredients-list">
          {isLoading && <p className="ingredient-empty">Cargando ingredientes...</p>}

          {!isLoading && ingredients.length === 0 && (
            <p className="ingredient-empty">Aun no hay ingredientes registrados.</p>
          )}

          {!isLoading &&
            ingredients.map((ingredient) => (
              <article key={ingredient.id} className="ingredient-item">
                <div>
                  <h3>{ingredient.name}</h3>
                  <p>Precio adicional: {formatPrice(ingredient.additional_price)}</p>
                </div>
                <div className="ingredient-item__actions">
                  <button type="button" onClick={() => handleEdit(ingredient)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(ingredient)}
                  >
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

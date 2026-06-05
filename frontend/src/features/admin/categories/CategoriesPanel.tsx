import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../../lib/api'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
} from './categoriesApi'
import './CategoriesPanel.css'

type CategoriesPanelProps = {
  token: string
}

type CategoryFormState = {
  name: string
  description: string
}

const emptyForm: CategoryFormState = {
  name: '',
  description: '',
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return 'No tienes permisos para modificar categorias.'
  }

  return 'No pudimos completar la accion. Intenta nuevamente.'
}

export function CategoriesPanel({ token }: CategoriesPanelProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadCategories() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getCategories()
        if (!ignore) {
          setCategories(data)
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

    loadCategories()

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
      description: form.description.trim() || null,
    }

    try {
      if (editingCategory) {
        const updatedCategory = await updateCategory(editingCategory.id, payload, token)
        setCategories((currentCategories) =>
          currentCategories.map((category) =>
            category.id === updatedCategory.id ? updatedCategory : category,
          ),
        )
      } else {
        const newCategory = await createCategory(payload, token)
        setCategories((currentCategories) => [...currentCategories, newCategory])
      }

      setForm(emptyForm)
      setEditingCategory(null)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setForm({
      name: category.name,
      description: category.description ?? '',
    })
  }

  function handleCancelEdit() {
    setEditingCategory(null)
    setForm(emptyForm)
  }

  async function handleDelete(category: Category) {
    const shouldDelete = window.confirm(`Eliminar categoria "${category.name}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deleteCategory(category.id, token)
      setCategories((currentCategories) =>
        currentCategories.filter((currentCategory) => currentCategory.id !== category.id),
      )

      if (editingCategory?.id === category.id) {
        handleCancelEdit()
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  return (
    <section id="catalogo" className="categories-panel" aria-labelledby="categories-title">
      <div className="categories-panel__header">
        <div>
          <p className="admin-kicker">Catalogo</p>
          <h2 id="categories-title">Categorias</h2>
        </div>
        <span>{categories.length} registradas</span>
      </div>

      <div className="categories-panel__grid">
        <form className="category-form" onSubmit={handleSubmit}>
          <h3>{editingCategory ? 'Editar categoria' : 'Nueva categoria'}</h3>

          <label>
            Nombre
            <input
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Pizzas"
              required
              type="text"
              value={form.name}
            />
          </label>

          <label>
            Descripcion
            <textarea
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Pizzas artesanales italianas"
              rows={4}
              value={form.description}
            />
          </label>

          {error && <p className="category-error">{error}</p>}

          <div className="category-form__actions">
            {editingCategory && (
              <button type="button" className="button-secondary" onClick={handleCancelEdit}>
                Cancelar
              </button>
            )}
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : editingCategory ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>

        <div className="categories-list">
          {isLoading && <p className="category-empty">Cargando categorias...</p>}

          {!isLoading && categories.length === 0 && (
            <p className="category-empty">Aun no hay categorias registradas.</p>
          )}

          {!isLoading &&
            categories.map((category) => (
              <article key={category.id} className="category-item">
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description || 'Sin descripcion'}</p>
                </div>
                <div className="category-item__actions">
                  <button type="button" onClick={() => handleEdit(category)}>
                    Editar
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(category)}>
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

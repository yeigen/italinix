import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../../lib/api'
import { getCategories, type Category } from '../categories/categoriesApi'
import { getIngredients, type Ingredient } from '../ingredients/ingredientsApi'
import {
  createProduct,
  deleteProduct,
  getProductsWithDetails,
  updateProduct,
  type ProductDetail,
} from './productsApi'
import './ProductsPanel.css'

type ProductsPanelProps = {
  token: string
}

type ProductFormState = {
  categoryId: string
  name: string
  description: string
  price: string
  imageUrl: string
  available: boolean
  ingredientIds: number[]
}

const emptyForm: ProductFormState = {
  categoryId: '',
  name: '',
  description: '',
  price: '0.00',
  imageUrl: '',
  available: true,
  ingredientIds: [],
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return 'No tienes permisos para modificar productos.'
  }

  if (error instanceof ApiError && error.status === 400) {
    return 'Revisa categoria e ingredientes seleccionados.'
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

export function ProductsPanel({ token }: ProductsPanelProps) {
  const [products, setProducts] = useState<ProductDetail[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadCatalogData() {
    const [productsData, categoriesData, ingredientsData] = await Promise.all([
      getProductsWithDetails(),
      getCategories(),
      getIngredients(),
    ])

    setProducts(productsData)
    setCategories(categoriesData)
    setIngredients(ingredientsData)
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialData() {
      setIsLoading(true)
      setError(null)

      try {
        const [productsData, categoriesData, ingredientsData] = await Promise.all([
          getProductsWithDetails(),
          getCategories(),
          getIngredients(),
        ])

        if (!ignore) {
          setProducts(productsData)
          setCategories(categoriesData)
          setIngredients(ingredientsData)
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

    loadInitialData()

    return () => {
      ignore = true
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    const payload = {
      category_id: Number(form.categoryId),
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price || 0).toFixed(2),
      image_url: form.imageUrl.trim() || null,
      available: form.available,
      ingredient_ids: form.ingredientIds,
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload, token)
      } else {
        await createProduct(payload, token)
      }

      await loadCatalogData()
      setForm(emptyForm)
      setEditingProduct(null)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(product: ProductDetail) {
    setEditingProduct(product)
    setForm({
      categoryId: String(product.category_id),
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      imageUrl: product.image_url ?? '',
      available: product.available,
      ingredientIds: product.ingredients.map((ingredient) => ingredient.id),
    })
  }

  function handleCancelEdit() {
    setEditingProduct(null)
    setForm(emptyForm)
  }

  function toggleIngredient(ingredientId: number) {
    setForm((currentForm) => ({
      ...currentForm,
      ingredientIds: currentForm.ingredientIds.includes(ingredientId)
        ? currentForm.ingredientIds.filter((currentId) => currentId !== ingredientId)
        : [...currentForm.ingredientIds, ingredientId],
    }))
  }

  async function handleDelete(product: ProductDetail) {
    const shouldDelete = window.confirm(`Eliminar producto "${product.name}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deleteProduct(product.id, token)
      setProducts((currentProducts) =>
        currentProducts.filter((currentProduct) => currentProduct.id !== product.id),
      )

      if (editingProduct?.id === product.id) {
        handleCancelEdit()
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  const canSubmit = categories.length > 0 && form.name.trim().length > 0

  return (
    <section id="productos" className="products-panel" aria-labelledby="products-title">
      <div className="products-panel__header">
        <div>
          <p className="admin-kicker">Catalogo</p>
          <h2 id="products-title">Productos</h2>
        </div>
        <span>{products.length} registrados</span>
      </div>

      <div className="products-panel__grid">
        <form className="product-form" onSubmit={handleSubmit}>
          <h3>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h3>

          <label>
            Categoria
            <select
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              required
              value={form.categoryId}
            >
              <option value="">Selecciona una categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nombre
            <input
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Pizza Margherita"
              required
              type="text"
              value={form.name}
            />
          </label>

          <label>
            Descripcion
            <textarea
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Tomate, mozzarella y albahaca"
              rows={3}
              value={form.description}
            />
          </label>

          <div className="product-form__row">
            <label>
              Precio
              <input
                min="0"
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                step="0.01"
                type="number"
                value={form.price}
              />
            </label>

            <label className="product-check">
              <input
                checked={form.available}
                onChange={(event) => setForm({ ...form, available: event.target.checked })}
                type="checkbox"
              />
              Disponible
            </label>
          </div>

          <label>
            Imagen URL
            <input
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="https://..."
              type="url"
              value={form.imageUrl}
            />
          </label>

          <fieldset className="ingredient-selector">
            <legend>Ingredientes</legend>
            {ingredients.length === 0 && <p>No hay ingredientes disponibles.</p>}
            {ingredients.map((ingredient) => (
              <label key={ingredient.id}>
                <input
                  checked={form.ingredientIds.includes(ingredient.id)}
                  onChange={() => toggleIngredient(ingredient.id)}
                  type="checkbox"
                />
                {ingredient.name}
              </label>
            ))}
          </fieldset>

          {error && <p className="product-error">{error}</p>}

          <div className="product-form__actions">
            {editingProduct && (
              <button type="button" className="button-secondary" onClick={handleCancelEdit}>
                Cancelar
              </button>
            )}
            <button type="submit" disabled={isSaving || !canSubmit}>
              {isSaving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>

        <div className="products-list">
          {isLoading && <p className="product-empty">Cargando productos...</p>}

          {!isLoading && products.length === 0 && (
            <p className="product-empty">Aun no hay productos registrados.</p>
          )}

          {!isLoading &&
            products.map((product) => (
              <article key={product.id} className="product-item">
                <div>
                  <span className="product-category">{product.category.name}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description || 'Sin descripcion'}</p>
                  <div className="product-meta">
                    <strong>{formatPrice(product.price)}</strong>
                    <span>{product.available ? 'Disponible' : 'No disponible'}</span>
                  </div>
                  <div className="product-ingredients">
                    {product.ingredients.length === 0 && <span>Sin ingredientes</span>}
                    {product.ingredients.map((ingredient) => (
                      <span key={ingredient.id}>{ingredient.name}</span>
                    ))}
                  </div>
                </div>
                <div className="product-item__actions">
                  <button type="button" onClick={() => handleEdit(product)}>
                    Editar
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(product)}>
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

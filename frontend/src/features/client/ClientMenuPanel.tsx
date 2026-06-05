import { useEffect, useState } from 'react'
import { ApiError } from '../../lib/api'
import { getMenuProducts } from './clientApi'
import { formatCurrency, type CartItem } from './clientTypes'
import type { ProductDetail } from '../admin/products/productsApi'
import './ClientMenuPanel.css'

type ClientMenuPanelProps = {
  cartItems: CartItem[]
  onAddItem: (item: CartItem) => void
  onRemoveItem: (itemId: string) => void
  onChangeQuantity: (itemId: string, quantity: number) => void
}

type ProductSelection = {
  ingredientIds: number[]
  notes: string
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return 'No pudimos cargar el menu desde el backend.'
  }

  return 'No pudimos cargar el menu.'
}

export function ClientMenuPanel({
  cartItems,
  onAddItem,
  onRemoveItem,
  onChangeQuantity,
}: ClientMenuPanelProps) {
  const [products, setProducts] = useState<ProductDetail[]>([])
  const [selections, setSelections] = useState<Record<number, ProductSelection>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadMenu() {
      setIsLoading(true)
      setError(null)

      try {
        const productsData = await getMenuProducts()
        if (!ignore) {
          setProducts(productsData.filter((product) => product.available))
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

    loadMenu()

    return () => {
      ignore = true
    }
  }, [])

  function toggleIngredient(productId: number, ingredientId: number) {
    setSelections((currentSelections) => {
      const currentSelection = currentSelections[productId] ?? { ingredientIds: [], notes: '' }
      const ingredientIds = currentSelection.ingredientIds.includes(ingredientId)
        ? currentSelection.ingredientIds.filter((currentId) => currentId !== ingredientId)
        : [...currentSelection.ingredientIds, ingredientId]

      return {
        ...currentSelections,
        [productId]: { ...currentSelection, ingredientIds },
      }
    })
  }

  function setNotes(productId: number, notes: string) {
    setSelections((currentSelections) => {
      const currentSelection = currentSelections[productId] ?? { ingredientIds: [], notes: '' }
      return {
        ...currentSelections,
        [productId]: { ...currentSelection, notes },
      }
    })
  }

  function addProduct(product: ProductDetail) {
    const selection = selections[product.id] ?? { ingredientIds: [], notes: '' }
    onAddItem({
      id: `${product.id}-${Date.now()}`,
      product,
      quantity: 1,
      ingredientIds: selection.ingredientIds,
      notes: selection.notes.trim(),
    })

    setSelections((currentSelections) => ({
      ...currentSelections,
      [product.id]: { ingredientIds: [], notes: '' },
    }))
  }

  return (
    <section id="menu" className="client-menu" aria-labelledby="client-menu-title">
      <div className="client-section-heading">
        <p className="client-kicker">Menu</p>
        <h2 id="client-menu-title">Elige tus favoritos</h2>
      </div>

      {error && <p className="client-alert">{error}</p>}

      <div className="client-menu__layout">
        <div className="client-products">
          {isLoading && <p className="client-empty">Cargando menu...</p>}
          {!isLoading && products.length === 0 && <p className="client-empty">No hay productos disponibles.</p>}

          {products.map((product) => {
            const selection = selections[product.id] ?? { ingredientIds: [], notes: '' }

            return (
              <article key={product.id} className="client-product-card">
                <div>
                  <span>{product.category.name}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description || 'Preparado al estilo Italinix.'}</p>
                  <strong>{formatCurrency(product.price)}</strong>
                </div>

                <fieldset>
                  <legend>Adicionales</legend>
                  {product.ingredients.length === 0 && <small>Sin adicionales disponibles</small>}
                  {product.ingredients.map((ingredient) => (
                    <label key={ingredient.id}>
                      <input
                        type="checkbox"
                        checked={selection.ingredientIds.includes(ingredient.id)}
                        onChange={() => toggleIngredient(product.id, ingredient.id)}
                      />
                      {ingredient.name} +{formatCurrency(ingredient.additional_price)}
                    </label>
                  ))}
                </fieldset>

                <label className="client-product-notes">
                  Notas
                  <input
                    type="text"
                    value={selection.notes}
                    onChange={(event) => setNotes(product.id, event.target.value)}
                    placeholder="Ej: sin cebolla"
                  />
                </label>

                <button type="button" onClick={() => addProduct(product)}>
                  Agregar al carrito
                </button>
              </article>
            )
          })}
        </div>

        <aside className="client-cart" aria-label="Carrito">
          <h3>Carrito</h3>
          {cartItems.length === 0 && <p className="client-empty">Tu carrito esta vacio.</p>}
          {cartItems.map((item) => (
            <article key={item.id} className="client-cart-item">
              <div>
                <strong>{item.product.name}</strong>
                <small>
                  {item.ingredientIds.length} adicionales
                  {item.notes ? ` - ${item.notes}` : ''}
                </small>
              </div>
              <div className="client-cart-item__actions">
                <input
                  min="1"
                  type="number"
                  value={item.quantity}
                  onChange={(event) => onChangeQuantity(item.id, Number(event.target.value))}
                />
                <button type="button" onClick={() => onRemoveItem(item.id)}>
                  Quitar
                </button>
              </div>
            </article>
          ))}
        </aside>
      </div>
    </section>
  )
}

import type { ProductDetail } from '../admin/products/productsApi'

export type CartItem = {
  id: string
  product: ProductDetail
  quantity: number
  ingredientIds: number[]
  notes: string
}

export function getCartItemUnitTotal(item: CartItem) {
  const ingredientsTotal = item.product.ingredients
    .filter((ingredient) => item.ingredientIds.includes(ingredient.id))
    .reduce((total, ingredient) => total + Number(ingredient.additional_price), 0)

  return Number(item.product.price) + ingredientsTotal
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + getCartItemUnitTotal(item) * item.quantity, 0)
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

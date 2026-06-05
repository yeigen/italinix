import { useEffect, useState } from 'react'
import bruschettaImage from '../../../assets/menu/bruschetta.jpg'
import carbonaraImage from '../../../assets/menu/carbonara.jpg'
import lasagnaImage from '../../../assets/menu/lasagna.jpg'
import margheritaImage from '../../../assets/menu/margherita.jpg'
import pepperoniImage from '../../../assets/menu/pepperoni.jpg'
import risottoImage from '../../../assets/menu/risotto.jpg'
import tiramisuImage from '../../../assets/menu/tiramisu.jpg'
import heroImage from '../../../assets/portada-italianix.webp'
import { Footer } from '../../components/layout/Footer'
import { Header } from '../../components/layout/Header'
import { API_URL } from '../../lib/api'
import type { ProductDetail } from '../admin/products/productsApi'
import { getMenuProducts } from '../client/clientApi'
import { formatCurrency } from '../client/clientTypes'
import './LandingPage.css'

type LandingPageProps = {
  onLoginClick: () => void
  onRegisterClick: () => void
}

type MenuDish = {
  id: string
  name: string
  description: string
  price: number | string
  image: string
  category?: string
}

// Image library for the menu. Products in the backend don't carry photos yet,
// so we resolve an appetizing fallback by dish name, then by category.
const imagesByName: Array<[string, string]> = [
  ['margherita', margheritaImage],
  ['pepperoni', pepperoniImage],
  ['peperoni', pepperoniImage],
  ['carbonara', carbonaraImage],
  ['alfredo', carbonaraImage],
  ['lasa', lasagnaImage],
  ['risotto', risottoImage],
  ['bruschetta', bruschettaImage],
  ['tiramis', tiramisuImage],
]

const imagesByCategory: Array<[string, string]> = [
  ['pizza', margheritaImage],
  ['pasta', carbonaraImage],
  ['risotto', risottoImage],
  ['antipast', bruschettaImage],
  ['entrada', bruschettaImage],
  ['postre', tiramisuImage],
  ['dolce', tiramisuImage],
  ['dessert', tiramisuImage],
]

function resolveDishImage(product: ProductDetail): string {
  if (product.image_url) {
    return product.image_url.startsWith('http')
      ? product.image_url
      : `${API_URL}${product.image_url}`
  }

  const name = product.name.toLowerCase()
  const byName = imagesByName.find(([key]) => name.includes(key))
  if (byName) {
    return byName[1]
  }

  const category = (product.category?.name ?? '').toLowerCase()
  const byCategory = imagesByCategory.find(([key]) => category.includes(key))
  return byCategory ? byCategory[1] : margheritaImage
}

function toDish(product: ProductDetail): MenuDish {
  return {
    id: String(product.id),
    name: product.name,
    description: product.description || 'Receta de la casa, recien hecha.',
    price: product.price,
    image: resolveDishImage(product),
    category: product.category?.name,
  }
}

// Shown only if the menu cannot be loaded, so the landing never looks broken.
const fallbackMenu: MenuDish[] = [
  {
    id: 'f-margherita',
    name: 'Pizza Margherita',
    description: 'Tomate San Marzano, mozzarella fresca y albahaca.',
    price: 9.99,
    image: margheritaImage,
    category: 'Pizzas',
  },
  {
    id: 'f-pepperoni',
    name: 'Pizza Pepperoni',
    description: 'Doble pepperoni, mozzarella y salsa de tomate.',
    price: 11.99,
    image: pepperoniImage,
    category: 'Pizzas',
  },
  {
    id: 'f-carbonara',
    name: 'Spaghetti alla Carbonara',
    description: 'Huevo, guanciale, pecorino y pimienta negra.',
    price: 12.5,
    image: carbonaraImage,
    category: 'Pastas',
  },
  {
    id: 'f-lasagna',
    name: 'Lasagna alla Bolognese',
    description: 'Capas de pasta, ragu lento y bechamel gratinada.',
    price: 13.9,
    image: lasagnaImage,
    category: 'Pastas',
  },
  {
    id: 'f-risotto',
    name: 'Risotto ai Funghi',
    description: 'Arroz cremoso con hongos y parmesano.',
    price: 13.2,
    image: risottoImage,
    category: 'Risotti',
  },
  {
    id: 'f-tiramisu',
    name: 'Tiramisu',
    description: 'Cafe, mascarpone y cacao. El clasico de la casa.',
    price: 6.5,
    image: tiramisuImage,
    category: 'Postres',
  },
]

const steps = ['Elige tu plato', 'Personaliza ingredientes', 'Sigue tu pedido']

export function LandingPage({ onLoginClick, onRegisterClick }: LandingPageProps) {
  const [dishes, setDishes] = useState<MenuDish[] | null>(null)

  useEffect(() => {
    let ignore = false

    getMenuProducts()
      .then((products) => {
        if (ignore) {
          return
        }
        const available = products.filter((product) => product.available)
        setDishes(available.length > 0 ? available.map(toDish) : fallbackMenu)
      })
      .catch(() => {
        if (!ignore) {
          setDishes(fallbackMenu)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="landing-page">
      <Header onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />

      <main>
        <section id="inicio" className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-kicker">Cocina italiana a tu ritmo</p>
            <h1 id="landing-title">Pide italiano sin complicarte la noche.</h1>
            <p>
              Explora el menu, personaliza tu pedido y recibelo en casa. Comida italiana
              recien hecha, facil y rapida.
            </p>

            <div className="landing-hero__actions">
              <a href="#menu">Ver el menu</a>
              <button type="button" onClick={onLoginClick}>
                Acceder
              </button>
              <button type="button" onClick={onRegisterClick}>
                Crear cuenta
              </button>
            </div>
          </div>

          <div className="landing-hero__image" aria-label="Plato italiano destacado">
            <img src={heroImage} alt="Mesa con comida italiana" />
            <div className="landing-hero__badge">
              <strong>30-45 min</strong>
              <span>Entrega estimada</span>
            </div>
          </div>
        </section>

        <section id="menu" className="landing-section landing-menu" aria-labelledby="menu-title">
          <div className="landing-section__heading">
            <p className="landing-kicker">Menu</p>
            <h2 id="menu-title">Nuestros favoritos, listos para pedir.</h2>
          </div>

          <div className="landing-menu__grid">
            {dishes === null
              ? [0, 1, 2].map((index) => (
                  <article key={`skeleton-${index}`} className="landing-menu__card landing-menu__card--skeleton">
                    <div className="landing-menu__image" />
                    <div className="landing-menu__content">
                      <span className="landing-menu__bar landing-menu__bar--sm" />
                      <span className="landing-menu__bar" />
                      <span className="landing-menu__bar landing-menu__bar--lg" />
                    </div>
                  </article>
                ))
              : dishes.map((dish) => (
                  <article key={dish.id} className="landing-menu__card">
                    <div className="landing-menu__image">
                      <img src={dish.image} alt={dish.name} loading="lazy" />
                    </div>
                    <div className="landing-menu__content">
                      {dish.category && <span className="landing-menu__tag">{dish.category}</span>}
                      <h3>{dish.name}</h3>
                      <p>{dish.description}</p>
                      <strong className="landing-menu__price">{formatCurrency(dish.price)}</strong>
                    </div>
                  </article>
                ))}
          </div>
        </section>

        <section
          id="experiencia"
          className="landing-section landing-experience"
          aria-labelledby="experience-title"
        >
          <div>
            <p className="landing-kicker">Experiencia</p>
            <h2 id="experience-title">Del antojo al pedido en pocos pasos.</h2>
          </div>

          <div className="landing-steps">
            {steps.map((step, index) => (
              <article key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step}</h3>
              </article>
            ))}
          </div>
        </section>

        <section id="entrega" className="landing-delivery" aria-labelledby="delivery-title">
          <div>
            <p className="landing-kicker">A domicilio</p>
            <h2 id="delivery-title">Tu italiano favorito, en la puerta de tu casa.</h2>
            <p>
              Crea tu cuenta, arma tu pedido y sigue tu entrega en minutos. Sin filas,
              sin llamadas, sin complicaciones.
            </p>
          </div>

          <button type="button" onClick={onRegisterClick}>
            Crear cuenta
          </button>
        </section>
      </main>

      <Footer />
    </div>
  )
}

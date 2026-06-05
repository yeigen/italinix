import { useEffect, useState } from 'react'
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

// El backend es la fuente de la verdad de las imágenes. Solo resolvemos rutas
// relativas contra el host del backend; las absolutas se usan tal cual.
function resolveImageSrc(imageUrl: string | null): string | undefined {
  if (!imageUrl) {
    return undefined
  }
  return imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`
}

const steps = ['Elige tu plato', 'Personaliza ingredientes', 'Sigue tu pedido']

export function LandingPage({ onLoginClick, onRegisterClick }: LandingPageProps) {
  const [products, setProducts] = useState<ProductDetail[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let ignore = false

    getMenuProducts()
      .then((data) => {
        if (!ignore) {
          setProducts(data.filter((product) => product.available))
        }
      })
      .catch(() => {
        if (!ignore) {
          setFailed(true)
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

          {failed ? (
            <p className="landing-menu__notice">
              Estamos sirviendo el menu. Vuelve en un momento para ver nuestros platos.
            </p>
          ) : products === null ? (
            <div className="landing-menu__grid">
              {[0, 1, 2].map((index) => (
                <article key={`skeleton-${index}`} className="landing-menu__card landing-menu__card--skeleton">
                  <div className="landing-menu__image" />
                  <div className="landing-menu__content">
                    <span className="landing-menu__bar landing-menu__bar--sm" />
                    <span className="landing-menu__bar" />
                    <span className="landing-menu__bar landing-menu__bar--lg" />
                  </div>
                </article>
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="landing-menu__notice">Pronto tendremos nuevos platos en el menu.</p>
          ) : (
            <div className="landing-menu__grid">
              {products.map((product) => {
                const imageSrc = resolveImageSrc(product.image_url)
                return (
                  <article key={product.id} className="landing-menu__card">
                    <div className="landing-menu__image">
                      {imageSrc && <img src={imageSrc} alt={product.name} loading="lazy" />}
                    </div>
                    <div className="landing-menu__content">
                      <span className="landing-menu__tag">{product.category.name}</span>
                      <h3>{product.name}</h3>
                      <p>{product.description || 'Receta de la casa, recien hecha.'}</p>
                      <strong className="landing-menu__price">{formatCurrency(product.price)}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
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

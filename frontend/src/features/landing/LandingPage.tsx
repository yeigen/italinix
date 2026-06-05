import antipastiImage from '../../../assets/antipasti-landing.jpg'
import pastaImage from '../../../assets/pasta-landing.jpg'
import pizzaImage from '../../../assets/pizza-landing.jpg'
import heroImage from '../../../assets/portada-italianix.webp'
import { Footer } from '../../components/layout/Footer'
import { Header } from '../../components/layout/Header'
import './LandingPage.css'

type LandingPageProps = {
  onLoginClick: () => void
  onRegisterClick: () => void
}

const menuHighlights = [
  {
    title: 'Pizzas al horno',
    description: 'Masa ligera, bordes dorados y combinaciones clasicas con buen queso.',
    image: pizzaImage,
    imageAlt: 'Pizza italiana recien horneada',
  },
  {
    title: 'Pastas cremosas',
    description: 'Salsas lentas, porciones generosas y ese punto casero que se nota.',
    image: pastaImage,
    imageAlt: 'Pasta cremosa servida en plato',
  },
  {
    title: 'Antipasti y extras',
    description: 'Entradas, ingredientes adicionales y acompanamientos para completar la mesa.',
    image: antipastiImage,
    imageAlt: 'Antipasti italiano con acompanamientos',
  },
]

const steps = ['Elige tu plato', 'Personaliza ingredientes', 'Sigue tu pedido']

export function LandingPage({ onLoginClick, onRegisterClick }: LandingPageProps) {
  return (
    <div className="landing-page">
      <Header onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />

      <main>
        <section id="inicio" className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-kicker">Cocina italiana a tu ritmo</p>
            <h1 id="landing-title">Pide italiano sin complicarte la noche.</h1>
            <p>
              Italinix junta menu, personalizacion, pedidos y entrega en una experiencia
              sencilla para clientes y organizada para la cocina.
            </p>

            <div className="landing-hero__actions">
              <a href="#menu">Ver favoritos</a>
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
            <h2 id="menu-title">Favoritos italianos listos para personalizar.</h2>
          </div>

          <div className="landing-menu__grid">
            {menuHighlights.map((item) => (
              <article key={item.title}>
                <div className="landing-menu__image">
                  <img src={item.image} alt={item.imageAlt} />
                </div>
                <div className="landing-menu__content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
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
            <p className="landing-kicker">Entrega</p>
            <h2 id="delivery-title">Cocina, admin y repartidores conectados.</h2>
            <p>
              El equipo puede preparar catalogo, controlar pedidos y asignar envios. El
              siguiente paso sera abrir el flujo cliente para pedir desde esta landing.
            </p>
          </div>

          <button type="button" onClick={onLoginClick}>
            Entrar al sistema
          </button>
        </section>
      </main>

      <Footer />
    </div>
  )
}

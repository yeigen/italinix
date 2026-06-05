import { useState, type FormEvent } from 'react'
import { PublicTopbar } from '../../components/layout/PublicTopbar'
import { ApiError } from '../../lib/api'
import { useAuth } from './useAuth'
import './LoginPage.css'

function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Correo o contrasena incorrectos.'
  }

  return 'No pudimos iniciar sesion. Intenta nuevamente.'
}

type LoginPageProps = {
  onBack?: () => void
  onRegisterClick?: () => void
}

export function LoginPage({ onBack, onRegisterClick }: LoginPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <PublicTopbar onBack={onBack} actionLabel="Registrarme" onAction={onRegisterClick} />

      <main className="login-page">
        <section className="login-hero" aria-labelledby="login-title">
          <p className="login-kicker">Italinix</p>
          <h1 id="login-title">Gestiona tu cocina italiana sin perder el ritmo.</h1>
          <p>
            Accede a tu cuenta para pedir, seguir tus envios o administrar el catalogo
            desde una sola experiencia.
          </p>
        </section>

        <section className="login-card" aria-label="Inicio de sesion">
          <div>
          <p className="login-card__eyebrow">Bienvenido</p>
          <h2>Inicia sesion</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo electronico
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contrasena"
              required
              type="password"
              value={password}
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

          {onRegisterClick && (
            <p className="login-register">
              No tienes cuenta?{' '}
              <button type="button" onClick={onRegisterClick}>
                Registrate
              </button>
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

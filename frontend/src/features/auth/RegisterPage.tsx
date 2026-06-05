import { useState, type FormEvent } from 'react'
import { PublicTopbar } from '../../components/layout/PublicTopbar'
import { ApiError } from '../../lib/api'
import { useAuth } from './useAuth'
import './RegisterPage.css'

type RegisterPageProps = {
  onBack: () => void
  onLoginClick: () => void
}

function getRegisterErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return 'Ya existe una cuenta con ese correo.'
  }

  return 'No pudimos crear tu cuenta. Intenta nuevamente.'
}

export function RegisterPage({ onBack, onLoginClick }: RegisterPageProps) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || null,
        rol: 'cliente',
        active: true,
      })
    } catch (registerError) {
      setError(getRegisterErrorMessage(registerError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <PublicTopbar onBack={onBack} actionLabel="Iniciar sesion" onAction={onLoginClick} />

      <main className="register-page">
        <section className="register-copy" aria-labelledby="register-title">
          <p className="register-kicker">Cuenta cliente</p>
          <h1 id="register-title">Crea tu cuenta y empieza a pedir.</h1>
          <p>
            Guarda tus datos, prepara direcciones y sigue cada pedido desde cocina hasta entrega.
          </p>
        </section>

        <section className="register-card" aria-label="Registro cliente">
        <div>
          <p className="register-card__eyebrow">Registro</p>
          <h2>Datos de cliente</h2>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Tu nombre"
              required
              type="text"
              value={name}
            />
          </label>

          <label>
            Correo electronico
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cliente@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Telefono
            <input
              autoComplete="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="555-0000"
              type="tel"
              value={phone}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete="new-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 6 caracteres"
              required
              type="password"
              value={password}
            />
          </label>

          {error && <p className="register-error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

          <p className="register-login">
            Ya tienes cuenta?{' '}
            <button type="button" onClick={onLoginClick}>
              Inicia sesion
            </button>
          </p>
        </section>
      </main>
    </div>
  )
}

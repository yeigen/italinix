import type { AuthUser } from './types'

type AccessDeniedProps = {
  user: AuthUser
  onLogout: () => void
}

export function AccessDenied({ user, onLogout }: AccessDeniedProps) {
  return (
    <main className="app-shell">
      <h1>Acceso limitado</h1>
      <p>
        {user.name}, tu rol actual es {user.rol}. Esta primera experiencia esta reservada
        para administradores.
      </p>
      <section className="session-card">
        <strong>{user.email}</strong>
        <button type="button" onClick={onLogout}>
          Cerrar sesion
        </button>
      </section>
    </main>
  )
}

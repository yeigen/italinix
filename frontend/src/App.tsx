import { useState } from 'react'
import './App.css'
import { AdminDashboard } from './features/admin/AdminDashboard'
import { AccessDenied } from './features/auth/AccessDenied'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { useAuth } from './features/auth/useAuth'
import { ClientHome } from './features/client/ClientHome'
import { DeliveryDashboard } from './features/delivery/DeliveryDashboard'
import { LandingPage } from './features/landing/LandingPage'

type PublicView = 'landing' | 'login' | 'register'

function App() {
  const { status, user, token, logout } = useAuth()
  const [publicView, setPublicView] = useState<PublicView>('landing')

  if (status === 'loading') {
    return (
      <main className="app-shell">
        <h1>Italinix</h1>
        <p>Validando sesion...</p>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    if (publicView === 'login') {
      return (
        <LoginPage
          onBack={() => setPublicView('landing')}
          onRegisterClick={() => setPublicView('register')}
        />
      )
    }

    if (publicView === 'register') {
      return (
        <RegisterPage
          onBack={() => setPublicView('landing')}
          onLoginClick={() => setPublicView('login')}
        />
      )
    }

    return (
      <LandingPage
        onLoginClick={() => setPublicView('login')}
        onRegisterClick={() => setPublicView('register')}
      />
    )
  }

  if (user?.rol === 'cliente') {
    return token ? <ClientHome user={user} token={token} onLogout={logout} /> : null
  }

  if (user?.rol === 'repartidor') {
    return token ? <DeliveryDashboard user={user} token={token} onLogout={logout} /> : null
  }

  if (user?.rol !== 'admin') {
    return user ? <AccessDenied user={user} onLogout={logout} /> : null
  }

  if (!token) {
    return null
  }

  return <AdminDashboard user={user} token={token} onLogout={logout} />
}

export default App

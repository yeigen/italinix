import './Header.css'

export type HeaderProps = {
  onLoginClick: () => void
  onRegisterClick: () => void
}

export function Header({ onLoginClick, onRegisterClick }: HeaderProps) {
  return (
    <header className="site-header">
      <a className="site-header__brand" href="#inicio" aria-label="Italinix inicio">
        <span>Italinix</span>
      </a>

      <nav className="site-header__nav" aria-label="Navegacion principal">
        <a href="#menu">Menu</a>
        <a href="#experiencia">Experiencia</a>
        <a href="#entrega">Entrega</a>
      </nav>

      <div className="site-header__actions">
        <button type="button" className="site-header__ghost" onClick={onLoginClick}>
          Iniciar sesion
        </button>
        <button type="button" onClick={onRegisterClick}>
          Registrarme
        </button>
      </div>
    </header>
  )
}

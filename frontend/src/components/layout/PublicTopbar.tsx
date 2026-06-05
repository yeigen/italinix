import './PublicTopbar.css'

type PublicTopbarProps = {
  onBack?: () => void
  /** Label + handler for the alternate action (e.g. "Registrarme" on the login page). */
  actionLabel?: string
  onAction?: () => void
}

export function PublicTopbar({ onBack, actionLabel, onAction }: PublicTopbarProps) {
  return (
    <header className="public-topbar">
      <button
        type="button"
        className="public-topbar__brand"
        onClick={onBack}
        aria-label="Volver al inicio"
      >
        Italinix
      </button>

      <div className="public-topbar__actions">
        {onBack && (
          <button type="button" className="public-topbar__ghost" onClick={onBack}>
            Volver al inicio
          </button>
        )}
        {actionLabel && onAction && (
          <button type="button" className="public-topbar__cta" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  )
}

import type { ReactNode } from 'react'
import { Badge } from '../ui/Badge'
import './AppShell.css'

export type ShellNavItem = {
  id: string
  label: string
  icon?: ReactNode
  /** Optional count rendered as a badge next to the label. */
  badge?: number
}

export type ShellNavGroup = {
  label?: string
  items: ShellNavItem[]
}

type AppShellProps = {
  brand: string
  roleLabel: string
  accent?: 'client' | 'admin' | 'delivery'
  nav: ShellNavGroup[]
  activeId: string
  onNavigate: (id: string) => void
  user: { name: string; email: string }
  onLogout: () => void
  /** Extra persistent actions (e.g. cart). Shown in the sidebar footer and mobile topbar. */
  actions?: ReactNode
  children: ReactNode
}

export function AppShell({
  brand,
  roleLabel,
  accent = 'client',
  nav,
  activeId,
  onNavigate,
  user,
  onLogout,
  actions,
  children,
}: AppShellProps) {
  const flatItems = nav.flatMap((group) => group.items)

  function renderNavItem(item: ShellNavItem) {
    const isActive = item.id === activeId
    return (
      <button
        key={item.id}
        type="button"
        className={`shell__nav-item${isActive ? ' is-active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => onNavigate(item.id)}
      >
        {item.icon && <span className="shell__nav-icon">{item.icon}</span>}
        <span className="shell__nav-label">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span className="shell__nav-badge">
            <Badge tone="accent" count>
              {item.badge}
            </Badge>
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={`shell shell--${accent}`}>
      <aside className="shell__sidebar" aria-label={`Navegacion ${roleLabel}`}>
        <div className="shell__brand">
          <span className="shell__logo">{brand}</span>
          <span className="shell__role">{roleLabel}</span>
        </div>

        <nav className="shell__nav">
          {nav.map((group, index) => (
            <div className="shell__group" key={group.label ?? `group-${index}`}>
              {group.label && <p className="shell__group-label">{group.label}</p>}
              {group.items.map(renderNavItem)}
            </div>
          ))}
        </nav>

        <div className="shell__footer">
          {actions && <div className="shell__actions">{actions}</div>}
          <div className="shell__user">
            <span className="shell__user-name">{user.name}</span>
            <span className="shell__user-email">{user.email}</span>
          </div>
          <button type="button" className="shell__logout" onClick={onLogout}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="shell__main">
        <header className="shell__topbar">
          <span className="shell__logo">{brand}</span>
          <div className="shell__topbar-actions">
            {actions}
            <button type="button" className="shell__logout shell__logout--compact" onClick={onLogout}>
              Salir
            </button>
          </div>
        </header>

        <main className="shell__content">
          <div className="shell__view" key={activeId}>
            {children}
          </div>
        </main>
      </div>

      <nav className="shell__bottomnav" aria-label={`Navegacion ${roleLabel}`}>
        {flatItems.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              className={`shell__bottom-item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon && <span className="shell__bottom-icon">{item.icon}</span>}
              <span className="shell__bottom-label">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="shell__bottom-dot" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

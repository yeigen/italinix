import { useEffect } from 'react'
import './Drawer.css'

type DrawerProps = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Drawer({ title, isOpen, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.classList.add('drawer-lock')
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('drawer-lock')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <div className={isOpen ? 'drawer drawer--open' : 'drawer'} aria-hidden={!isOpen}>
      <button className="drawer__overlay" type="button" onClick={onClose} aria-label="Cerrar panel" />
      <aside className="drawer__panel" aria-label={title} aria-modal="true" role="dialog">
        <header className="drawer__header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            Cerrar
          </button>
        </header>
        {children}
      </aside>
    </div>
  )
}

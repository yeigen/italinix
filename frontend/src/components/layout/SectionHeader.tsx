import type { ReactNode } from 'react'
import './SectionHeader.css'

type SectionHeaderProps = {
  kicker?: string
  title: string
  titleId?: string
  description?: string
  actions?: ReactNode
}

export function SectionHeader({ kicker, title, titleId, description, actions }: SectionHeaderProps) {
  return (
    <header className="section-header">
      <div className="section-header__text">
        {kicker && <p className="section-header__kicker">{kicker}</p>}
        <h2 className="section-header__title" id={titleId}>
          {title}
        </h2>
        {description && <p className="section-header__desc">{description}</p>}
      </div>
      {actions && <div className="section-header__actions">{actions}</div>}
    </header>
  )
}

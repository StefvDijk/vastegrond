import type { ReactNode } from 'react'

type ScreenHeaderProps = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function ScreenHeader({ eyebrow, title, description, actions }: ScreenHeaderProps) {
  return (
    <header className="vg-screen-header">
      <div className="vg-screen-header__title-group">
        {eyebrow ? <span className="t-caption t-faded">{eyebrow}</span> : null}
        <h1 className="t-display-l">{title}</h1>
        {description ? (
          <p className="t-body-l t-soft" style={{ maxWidth: '56ch' }}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="vg-screen-header__actions">{actions}</div> : null}
    </header>
  )
}

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="vg-empty">
      {Icon ? (
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-paper-deep text-ink-soft">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      ) : null}
      <h3 className="t-heading-m">{title}</h3>
      {description ? (
        <p className="t-body-m t-soft mx-auto mt-2 max-w-md">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

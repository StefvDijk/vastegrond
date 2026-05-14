import type { ReactNode } from 'react'

type ProgressRowProps = {
  label: ReactNode
  value: number
  total: number
  hint?: ReactNode
}

export function ProgressRow({ label, value, total, hint }: ProgressRowProps) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0
  return (
    <div className="vg-progress-row">
      <div className="vg-progress-row__label">
        <span>{label}</span>
        <span className="t-faded tabular">
          {hint ?? `${value} / ${total}`}
        </span>
      </div>
      <div className="vg-progress" aria-hidden>
        <div className="vg-progress__bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

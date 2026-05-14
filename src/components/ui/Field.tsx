import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type FieldProps = {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
  htmlFor?: string
}

export function Field({ label, hint, error, required, className, children, htmlFor }: FieldProps) {
  return (
    <div className={cn('vg-field', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="vg-field__label">
          {label}
          {required ? <span className="text-negative ml-1">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <span className="text-body-s text-negative">{error}</span> : null}
      {!error && hint ? <span className="text-body-s t-faded">{hint}</span> : null}
    </div>
  )
}

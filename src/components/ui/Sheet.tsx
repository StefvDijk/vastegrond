import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

type SheetProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  footer?: ReactNode
  children: ReactNode
  width?: number
}

export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  children,
  width = 480,
}: SheetProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <>
      <div className="vg-overlay" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn('animate-sheet-in')}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width,
          maxWidth: '100vw',
          zIndex: 60,
        }}
      >
        <div className="vg-sheet">
          <div className="vg-sheet__header">
            <div className="flex flex-col gap-1">
              {eyebrow ? <span className="t-caption t-faded">{eyebrow}</span> : null}
              <h2 className="t-heading-l">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="vg-sheet__close"
              aria-label="Sluiten"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <div className="vg-sheet__body">{children}</div>
          {footer ? <div className="vg-sheet__footer">{footer}</div> : null}
        </div>
      </aside>
    </>,
    document.body,
  )
}

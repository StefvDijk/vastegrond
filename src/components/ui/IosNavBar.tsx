import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  title: string
  eyebrow?: ReactNode
  description?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
}

/**
 * iPhone-style nav. Returns two sibling blocks:
 *   1. A 44pt translucent bar (position: sticky) with leading / compact-title / trailing.
 *   2. The large-title block that lives in normal page flow and scrolls under the bar.
 *
 * As the large title scrolls past the bar, the bar gains a hairline divider and
 * the compact 17pt title fades in — standard iOS large-title behaviour.
 *
 * Hidden on desktop (>=768px) where the global vg-topnav handles chrome.
 */
export function IosNavBar({ title, eyebrow, description, leading, trailing }: Props) {
  const largeRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const el = largeRef.current
    if (!el) return

    function onScroll() {
      const navHeight = 44
      const safeTopRaw = getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-top)')
        .trim()
      const safeTop = Number.parseFloat(safeTopRaw) || 0
      const rect = el!.getBoundingClientRect()
      // Collapse when the bottom of the large-title block has passed the bar.
      setCollapsed(rect.bottom <= navHeight + safeTop + 4)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className={cn('vg-iosnav md:hidden', collapsed && 'vg-iosnav--collapsed')}>
        <div className="vg-iosnav__bar">
          <div>{leading}</div>
          <div className="vg-iosnav__compact-title">{title}</div>
          <div>{trailing}</div>
        </div>
      </div>
      <div ref={largeRef} className="vg-iosnav-large md:hidden">
        {eyebrow ? <div className="vg-iosnav-large__eyebrow">{eyebrow}</div> : null}
        <h1 className="vg-iosnav-large__title">{title}</h1>
        {description ? <p className="vg-iosnav-large__desc">{description}</p> : null}
      </div>
    </>
  )
}

type ActionProps = {
  children: ReactNode
  onClick?: () => void
  primary?: boolean
  disabled?: boolean
  'aria-label'?: string
}

export function IosNavAction({ children, onClick, primary, disabled, ...rest }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn('vg-iosnav__action', primary && 'vg-iosnav__action--primary')}
      {...rest}
    >
      {children}
    </button>
  )
}

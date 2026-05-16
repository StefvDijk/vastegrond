import { ExternalLink } from 'lucide-react'
import type { Inspiration } from '../../types/domain'
import { useInspirationImageUrl } from './hooks'

type InspirationCardProps = {
  inspiration: Inspiration
  dishName?: string
  courseName?: string
  onClick: () => void
}

export function InspirationCard({
  inspiration,
  dishName,
  courseName,
  onClick,
}: InspirationCardProps) {
  const imageUrlQ = useInspirationImageUrl(inspiration.imagePath)
  const host = inspiration.url ? safeHost(inspiration.url) : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="vg-card vg-card--bordered text-left hover:bg-paper-deep transition-colors"
      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
    >
      {inspiration.imagePath ? (
        <div className="aspect-[4/3] w-full" style={{ background: 'var(--paper-deep)' }}>
          {imageUrlQ.data ? (
            <img
              src={imageUrlQ.data}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
      ) : null}
      <div className="p-s-5 flex flex-col gap-s-3">
        <div>
          <h3
            className="line-clamp-2"
            style={{ fontSize: 18, lineHeight: 1.25, letterSpacing: '-0.018em', fontWeight: 600 }}
          >
            {inspiration.title || (host ?? 'Inspiratie')}
          </h3>
          {host ? (
            <a
              href={inspiration.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-s-1 t-mono-s t-faded hover:text-ink mt-s-1"
            >
              <ExternalLink size={12} aria-hidden />
              {host}
            </a>
          ) : null}
        </div>
        {inspiration.note ? (
          <p className="t-body-s t-soft whitespace-pre-wrap line-clamp-3">
            {inspiration.note}
          </p>
        ) : null}
        {(inspiration.tags.length > 0 || dishName || courseName) && (
          <div className="flex flex-wrap gap-s-2">
            {courseName ? (
              <span className="t-mono-s t-faded">{courseName}</span>
            ) : null}
            {dishName ? (
              <span className="t-mono-s" style={{ color: 'var(--ink-soft)' }}>
                {dishName}
              </span>
            ) : null}
            {inspiration.tags.map((t) => (
              <span key={t} className="t-mono-s t-accent">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

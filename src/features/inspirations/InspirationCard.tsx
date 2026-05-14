import { ExternalLink } from 'lucide-react'
import type { Inspiration } from '../../types/domain'
import { Badge, Card } from '../../components/ui'
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
    <Card className="p-0 overflow-hidden cursor-pointer hover:bg-paper-deep transition" onClick={onClick}>
      {inspiration.imagePath ? (
        <div className="aspect-[4/3] w-full bg-paper-deep">
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
          <h3 className="t-heading-m line-clamp-1">
            {inspiration.title || (host ?? 'Inspiratie')}
          </h3>
          {host ? (
            <a
              href={inspiration.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-s-1 t-caption t-faded hover:text-ink"
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
            {courseName ? <Badge variant="outline">{courseName}</Badge> : null}
            {dishName ? <Badge variant="neutral">{dishName}</Badge> : null}
            {inspiration.tags.map((t) => (
              <Badge key={t} variant="outline">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

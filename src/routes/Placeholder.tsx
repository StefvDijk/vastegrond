type PlaceholderProps = {
  title: string
  description?: string
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-2 text-text-muted">{description}</p>
      ) : (
        <p className="mt-2 text-text-muted">
          Deze sectie wordt in een volgende fase ingevuld.
        </p>
      )}
    </div>
  )
}

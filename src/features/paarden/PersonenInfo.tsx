type Person = {
  id: string
  isOwner: boolean
  isRider: boolean
  user: { id: string; name: string | null; email: string }
}

function rolLabels(p: Person): string[] {
  const labels: string[] = []
  if (p.isOwner) labels.push('Eigenaar')
  if (p.isRider) labels.push('Bereider')
  return labels
}

export default function PersonenInfo({ people }: { people: Person[] }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Eigenaar &amp; bereider</span>
      </div>
      <div className="panel-body">
        {people.length === 0 ? (
          <div className="detail-field-value muted">Nog geen personen gekoppeld.</div>
        ) : (
          people.map((p) => (
            <div key={p.id} className="detail-field" style={{ marginBottom: 12 }}>
              <div className="detail-field-value">
                {p.user.name ?? p.user.email}
                {p.user.name && (
                  <span className="muted" style={{ marginLeft: 8, fontSize: 'var(--velaro-text-sm)' }}>{p.user.email}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {rolLabels(p).map((label) => (
                  <span key={label} className="badge badge-gold">{label}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

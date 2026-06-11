type Stable = {
  name: string
  address: string | null
  postalCode: string | null
  city: string | null
  phone: string | null
  email: string | null
  website: string | null
  description: string | null
  openingHours: string | null
}

function Rij({ label, waarde }: { label: string; waarde: string | null | undefined }) {
  if (!waarde) return null
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{waarde}</div>
    </div>
  )
}

export default function StalGegevensPanel({ stable }: { stable: Stable }) {
  const adresregel = [stable.address, [stable.postalCode, stable.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Stal</span>
      </div>
      <div className="panel-body">
        {stable.description && (
          <p style={{ fontSize: 'var(--velaro-text-sm)', color: 'var(--velaro-color-muted)', marginBottom: 16 }}>
            {stable.description}
          </p>
        )}

        <div className="detail-fields" style={{ gridTemplateColumns: '1fr' }}>
          <Rij label="Stal" waarde={stable.name} />
          {adresregel && <Rij label="Adres" waarde={adresregel} />}
          <Rij label="Telefoon" waarde={stable.phone} />
          <Rij label="E-mail" waarde={stable.email} />
          {stable.website && (
            <div className="detail-field">
              <div className="detail-field-label">Website</div>
              <div className="detail-field-value">
                <a
                  href={stable.website.startsWith('http') ? stable.website : `https://${stable.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--velaro-color-gold-2)', textDecoration: 'underline' }}
                >
                  {stable.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}
        </div>

        {stable.openingHours && (
          <div style={{ marginTop: 16 }}>
            <div className="detail-field-label" style={{ marginBottom: 6 }}>Openingstijden</div>
            <div
              style={{
                fontSize: 'var(--velaro-text-sm)',
                color: 'var(--velaro-color-navy)',
                whiteSpace: 'pre-line',
              }}
            >
              {stable.openingHours}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

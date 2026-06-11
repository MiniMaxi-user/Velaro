import { getAllStables } from '@/features/admin/queries'

export default async function AdminStallenPage() {
  const stables = await getAllStables()

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Admin</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Stallen</span>
          </div>
          <h1 className="page-title">Alle <em>stallen</em></h1>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 400 }}>
        <div className="kpi-card">
          <div className="kpi-card-body">
            <div className="kpi-card-value">{stables.length}</div>
            <div className="kpi-card-label">Stallen totaal</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-body">
            <div className="kpi-card-value">
              {stables.reduce((sum, s) => sum + s._count.horses, 0)}
            </div>
            <div className="kpi-card-label">Paarden totaal</div>
          </div>
        </div>
      </div>

      {stables.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">Nog geen stallen</div>
          <p style={{ color: 'var(--velaro-color-muted)', marginTop: 8 }}>
            Er zijn nog geen stallen aangemaakt op het platform.
          </p>
        </div>
      ) : (
        <div className="data-grid-wrapper">
          <table className="data-grid">
            <thead>
              <tr>
                <th>Stal</th>
                <th>Stad</th>
                <th>Eigenaar</th>
                <th>Paarden</th>
                <th>Leden</th>
              </tr>
            </thead>
            <tbody>
              {stables.map((stable) => {
                const owner = stable.members[0]?.user
                return (
                  <tr key={stable.id}>
                    <td>
                      <div className="cell-entity">
                        <div className="cell-avatar">🏠</div>
                        <div className="cell-entity-name">{stable.name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--velaro-color-muted)' }}>{stable.city ?? '—'}</td>
                    <td>
                      {owner ? (
                        <div>
                          <div>{owner.name ?? '—'}</div>
                          <div style={{ color: 'var(--velaro-color-muted)', fontSize: 12 }}>{owner.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--velaro-color-muted)' }}>—</span>
                      )}
                    </td>
                    <td><span className="badge badge-neutral">{stable._count.horses}</span></td>
                    <td><span className="badge badge-neutral">{stable._count.members}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

import Link from 'next/link'
import { getOwnerAccounts } from '@/features/admin/queries'
import QuotumForm from '@/features/admin/QuotumForm'

export default async function EigenaarenPage() {
  const owners = await getOwnerAccounts()

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Admin</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Eigenaren</span>
          </div>
          <h1 className="page-title">Eigenaar<em>accounts</em></h1>
        </div>
        <div className="page-header-actions">
          <Link href="/admin/eigenaren/nieuw" className="btn-primary">+ Nieuw account</Link>
        </div>
      </div>

      {owners.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">Nog geen eigenaar-accounts</div>
          <p style={{ color: 'var(--velaro-color-muted)', marginTop: 8 }}>
            Maak het eerste eigenaaraccount aan voor een klant.
          </p>
          <div style={{ marginTop: 16 }}>
            <Link href="/admin/eigenaren/nieuw" className="btn-primary">+ Nieuw account</Link>
          </div>
        </div>
      ) : (
        <div className="data-grid-wrapper">
          <table className="data-grid">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mailadres</th>
                <th>Stallen</th>
                <th>Quotum</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr key={owner.id}>
                  <td>
                    <div className="cell-entity">
                      <div className="cell-avatar">
                        {(owner.name ?? owner.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="cell-entity-name">{owner.name ?? '—'}</div>
                        <div className="cell-entity-sub">{owner.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--velaro-color-muted)' }}>{owner.email}</td>
                  <td>
                    <span className="badge badge-neutral">
                      {owner._count.stableMemberships} / {owner.maxStables}
                    </span>
                  </td>
                  <td>
                    <QuotumForm userId={owner.id} currentMax={owner.maxStables} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

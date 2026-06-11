import Link from 'next/link'
import { getAllHorses } from '@/features/admin/queries'
import { berekenLeeftijd, GESLACHT_LABELS } from '@/features/paarden/paardHelpers'
import type { HorseSex } from '@prisma/client'

function leeftijdLabel(dateOfBirth: Date | null): string {
  if (!dateOfBirth) return '—'
  return `${berekenLeeftijd(new Date(dateOfBirth))} jr`
}

export default async function AdminPaardenPage() {
  const horses = await getAllHorses()

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Admin</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Paarden</span>
          </div>
          <h1 className="page-title">Alle <em>paarden</em></h1>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 400 }}>
        <div className="kpi-card">
          <div className="kpi-card-body">
            <div className="kpi-card-value">{horses.length}</div>
            <div className="kpi-card-label">Paarden totaal</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-body">
            <div className="kpi-card-value">
              {new Set(horses.map((h) => h.stableId)).size}
            </div>
            <div className="kpi-card-label">Stallen</div>
          </div>
        </div>
      </div>

      {horses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">Nog geen paarden</div>
          <p style={{ color: 'var(--velaro-color-muted)', marginTop: 8 }}>
            Er zijn nog geen paarden aangemaakt op het platform.
          </p>
        </div>
      ) : (
        <div className="data-grid-wrapper">
          <table className="data-grid">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Stal</th>
                <th>Ras</th>
                <th>Leeftijd</th>
                <th>Geslacht</th>
                <th>Discipline</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {horses.map((horse) => (
                <tr key={horse.id}>
                  <td>
                    <div className="cell-entity">
                      <div className="cell-avatar">🐴</div>
                      <div>
                        <div className="cell-entity-name">{horse.name}</div>
                        {horse.ueln && (
                          <div className="cell-entity-sub">UELN {horse.ueln}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--velaro-color-muted)' }}>{horse.stable.name}</td>
                  <td>{horse.breed ?? <span style={{ color: 'var(--velaro-color-muted-2)' }}>—</span>}</td>
                  <td>{leeftijdLabel(horse.dateOfBirth)}</td>
                  <td>
                    {horse.sex
                      ? GESLACHT_LABELS[horse.sex as HorseSex]
                      : <span style={{ color: 'var(--velaro-color-muted-2)' }}>—</span>}
                  </td>
                  <td>
                    {horse.discipline ? (
                      <span className="badge badge-gold">{horse.discipline}</span>
                    ) : (
                      <span style={{ color: 'var(--velaro-color-muted-2)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/paarden/${horse.id}`} className="btn-icon" title="Bekijken">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4Z" stroke="currentColor" strokeWidth="1.3"/>
                          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                        </svg>
                      </Link>
                    </div>
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

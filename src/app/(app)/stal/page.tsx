import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserStable, getHorsesForStable } from '@/features/paarden/queries'
import { getTaskCountsForDate } from '@/features/taken/queries'
import { getStableRole } from '@/lib/auth/authorization'

function toDateParam(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default async function StalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stable = await getUserStable(user.id)
  if (!stable) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <div className="empty-state__title">Geen stal gevonden</div>
          <p>Je bent nog niet aan een stal gekoppeld.</p>
        </div>
      </main>
    )
  }

  const today = new Date()
  const [horses, role, takenVandaag] = await Promise.all([
    getHorsesForStable(stable.id),
    getStableRole(user.id, stable.id),
    getTaskCountsForDate(stable.id, today),
  ])

  const isOwner = role === 'OWNER'
  const openTaken = takenVandaag.total - takenVandaag.completed

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <div className="label">Dashboard</div>
          <h1 className="page-title">
            Mijn <em>Stal</em>
          </h1>
        </div>
      </div>

      {/* Stat-kaarten */}
      <div className="stal-stats">
        <div className="stal-stat-card">
          <div className="stal-stat-card__waarde">{horses.length}</div>
          <div className="stal-stat-card__label">Paarden</div>
        </div>
        <div className="stal-stat-card">
          <div className="stal-stat-card__waarde">{openTaken}</div>
          <div className="stal-stat-card__label">Open taken vandaag</div>
        </div>
        {takenVandaag.total > 0 && (
          <div className="stal-stat-card">
            <div className="stal-stat-card__waarde">
              {takenVandaag.completed}/{takenVandaag.total}
            </div>
            <div className="stal-stat-card__label">Taken afgerond</div>
          </div>
        )}
      </div>

      {/* Snelkoppelingen */}
      <div className="stal-acties">
        <Link href={`/stal/taken?datum=${toDateParam(today)}`} className="stal-actie-kaart">
          <div className="stal-actie-kaart__icon">✓</div>
          <div className="stal-actie-kaart__tekst">
            <div className="stal-actie-kaart__titel">Taken vandaag</div>
            <div className="stal-actie-kaart__sub">
              {openTaken > 0 ? `${openTaken} openstaand` : 'Alles gedaan'}
            </div>
          </div>
        </Link>
        <Link href="/paarden" className="stal-actie-kaart">
          <div className="stal-actie-kaart__icon">🐴</div>
          <div className="stal-actie-kaart__tekst">
            <div className="stal-actie-kaart__titel">Paarden</div>
            <div className="stal-actie-kaart__sub">{horses.length} in de stal</div>
          </div>
        </Link>
        {isOwner && (
          <Link href="/stal/leden" className="stal-actie-kaart">
            <div className="stal-actie-kaart__icon">👥</div>
            <div className="stal-actie-kaart__tekst">
              <div className="stal-actie-kaart__titel">Leden</div>
              <div className="stal-actie-kaart__sub">Beheer medewerkers</div>
            </div>
          </Link>
        )}
      </div>

      {/* Paardenoverzicht */}
      {horses.length > 0 && (
        <div style={{ marginTop: 'var(--velaro-space-10)' }}>
          <div className="label">Stalbewoners</div>
          <div className="stal-paarden-lijst">
            {horses.map((horse) => (
              <Link key={horse.id} href={`/paarden/${horse.id}`} className="stal-paard-rij">
                <div className="stal-paard-rij__naam">{horse.name}</div>
                <div className="stal-paard-rij__meta">
                  {horse.boxNumber && (
                    <span className="paard-card__badge">Box {horse.boxNumber}</span>
                  )}
                  {horse.breed && (
                    <span className="stal-paard-rij__ras">{horse.breed}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

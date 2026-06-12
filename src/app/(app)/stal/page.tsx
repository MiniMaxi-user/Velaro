import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getUserStable, getHorsesForStable } from '@/features/paarden/queries'
import { getTaskCountsForDate } from '@/features/taken/queries'
import { getStableRole, canCreateStable, isPlatformAdmin, getMemberships } from '@/lib/auth/authorization'
import { getAankomendGezondheidActies } from '@/features/gezondheid/queries'
import AankomendZorgPanel from '@/features/gezondheid/AankomendZorgPanel'
import { getMessagesForStable } from '@/features/berichten/queries'
import { markMessagesRead } from '@/features/berichten/actions'
import BerichtenPanel from '@/features/berichten/BerichtenPanel'
import { prisma } from '@/lib/prisma'
import { getActiveStableId, ALLE_STALLEN } from '@/lib/active-stable'

function toDateParam(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default async function StalPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  // Platform admins hebben hun eigen dashboard
  const isAdmin = await isPlatformAdmin(user.id)
  if (isAdmin) redirect('/admin')

  const activeStableId = await getActiveStableId(user.id)
  const alleStallen = activeStableId === ALLE_STALLEN

  // Modus: alle stallen van de gebruiker
  if (alleStallen) {
    const memberships = await getMemberships(user.id)
    if (memberships.length === 0) redirect('/eigenaar')

    const stableIds = memberships.map((m) => m.stableId)
    const today = new Date()
    const hour = today.getHours()
    const begroeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond'

    const [horses, takenCounts, zorgActiesPerStal] = await Promise.all([
      prisma.horse.findMany({
        where: { stableId: { in: stableIds } },
        orderBy: { name: 'asc' },
      }),
      Promise.all(stableIds.map((id) => getTaskCountsForDate(id, today))),
      Promise.all(stableIds.map((id) => getAankomendGezondheidActies(id, 30))),
    ])

    const takenVandaag = takenCounts.reduce(
      (acc, c) => ({ total: acc.total + c.total, completed: acc.completed + c.completed }),
      { total: 0, completed: 0 },
    )
    const zorgActies = zorgActiesPerStal.flat()
    const openTaken = takenVandaag.total - takenVandaag.completed
    const verlopenZorg = zorgActies.filter((a) => a.isVerlopen).length
    const takenPercentage =
      takenVandaag.total > 0
        ? Math.round((takenVandaag.completed / takenVandaag.total) * 100)
        : null

    return (
      <>
        <div className="page-header">
          <div className="page-header-left">
            <div className="breadcrumb">
              <span className="breadcrumb-current">Dashboard</span>
            </div>
            <h1 className="page-title">{begroeting} — <em>Alle stallen</em></h1>
          </div>
          <div className="page-header-actions">
            <Link href="/paarden/nieuw" className="btn-primary">+ Nieuw paard</Link>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-card-icon">🐴</div>
            <div className="kpi-card-body">
              <div className="kpi-card-value">{horses.length}</div>
              <div className="kpi-card-label">Paarden</div>
              <div className="kpi-card-trend flat">alle stallen</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-icon amber">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="4" width="14" height="12" rx="2" stroke="var(--velaro-color-warning)" strokeWidth="1.4"/>
                <path d="M5 2v4M13 2v4M2 8h14" stroke="var(--velaro-color-warning)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="kpi-card-body">
              <div className="kpi-card-value">{openTaken}</div>
              <div className="kpi-card-label">Open taken vandaag</div>
              <div className="kpi-card-trend flat">alle stallen</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-icon success">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9l4 4 6-7" stroke="var(--velaro-color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="kpi-card-body">
              <div className="kpi-card-value">
                {takenVandaag.total > 0
                  ? `${takenVandaag.completed}/${takenVandaag.total}`
                  : '—'}
              </div>
              <div className="kpi-card-label">Taken afgerond</div>
              {takenPercentage !== null && (
                <div className={`kpi-card-trend ${takenPercentage >= 80 ? 'up' : takenPercentage >= 40 ? 'flat' : 'down'}`}>
                  {takenPercentage}% voltooid
                </div>
              )}
            </div>
          </div>
          <div className="kpi-card">
            <div className={`kpi-card-icon ${verlopenZorg > 0 ? 'amber' : 'success'}`}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v5l3 3" stroke={verlopenZorg > 0 ? 'var(--velaro-color-warning)' : 'var(--velaro-color-success)'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="9" r="7" stroke={verlopenZorg > 0 ? 'var(--velaro-color-warning)' : 'var(--velaro-color-success)'} strokeWidth="1.4"/>
              </svg>
            </div>
            <div className="kpi-card-body">
              <div className="kpi-card-value" style={verlopenZorg > 0 ? { color: 'var(--velaro-color-warning)' } : undefined}>
                {verlopenZorg > 0 ? verlopenZorg : zorgActies.length}
              </div>
              <div className="kpi-card-label">
                {verlopenZorg > 0 ? 'Verlopen zorg' : 'Aankomende zorg (30d)'}
              </div>
              <div className={`kpi-card-trend ${verlopenZorg > 0 ? 'down' : 'flat'}`}>
                {verlopenZorg > 0 ? `▼ ${verlopenZorg} verlopen` : 'komende 30 dagen'}
              </div>
            </div>
          </div>
        </div>

        <AankomendZorgPanel acties={zorgActies} />

        {horses.length > 0 && (
          <div>
            <div style={{ marginBottom: 10 }}>
              <span className="label">Stalbewoners — alle stallen</span>
            </div>
            <div className="paard-kaart-grid">
              {horses.map((horse) => (
                <Link key={horse.id} href={`/paarden/${horse.id}`} className="paard-kaart">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div className="paard-kaart__naam">{horse.name}</div>
                    {horse.boxNumber && (
                      <span className="badge badge-neutral" style={{ marginLeft: 8, flexShrink: 0 }}>Box {horse.boxNumber}</span>
                    )}
                  </div>
                  <div className="paard-kaart__meta">
                    {[horse.breed, horse.discipline].filter(Boolean).join(' · ') || 'Geen verdere gegevens'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  // Modus: specifieke actieve stal
  const [stable, canCreate] = await Promise.all([
    getUserStable(user.id),
    canCreateStable(user.id),
  ])

  if (!stable) {
    // Paardeneigenaar zonder stalbeheerrol: doorsturen naar eigenaar-dashboard
    const isHorseOwner = await prisma.horseOwner.count({ where: { userId: user.id } })
    if (isHorseOwner > 0) redirect('/eigenaar')

    return (
      <div className="empty-state">
        <div className="empty-state__title">Geen actieve stal</div>
        <p style={{ color: 'var(--velaro-color-muted)', marginTop: 8 }}>
          Je bent nog niet aan een stal gekoppeld.
        </p>
        {canCreate && (
          <div style={{ marginTop: 16 }}>
            <Link href="/stallen/nieuw" className="btn-primary">Eerste stal aanmaken</Link>
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <Link href="/stallen" className="btn-ghost">Mijn stallen</Link>
        </div>
      </div>
    )
  }

  const today = new Date()
  const [horses, role, takenVandaag, zorgActies, berichten] = await Promise.all([
    getHorsesForStable(stable.id),
    getStableRole(user.id, stable.id),
    getTaskCountsForDate(stable.id, today),
    getAankomendGezondheidActies(stable.id, 30),
    getMessagesForStable(stable.id, 10),
  ])

  const isOwner = role === 'OWNER'

  // Wie het staldashboard opent, heeft de stalberichten gezien.
  if (role !== null && berichten.length > 0) {
    await markMessagesRead(berichten.map((b) => b.id))
  }
  const openTaken = takenVandaag.total - takenVandaag.completed
  const verlopenZorg = zorgActies.filter((a) => a.isVerlopen).length

  // Dynamische begroeting op basis van uur van de dag (server-side)
  const hour = today.getHours()
  const begroeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond'

  // Trend-tekst voor taken afgerond
  const takenPercentage =
    takenVandaag.total > 0
      ? Math.round((takenVandaag.completed / takenVandaag.total) * 100)
      : null

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Dashboard</span>
          </div>
          <h1 className="page-title">{begroeting} — <em>{stable.name}</em></h1>
        </div>
        <div className="page-header-actions">
          <Link href="/paarden/nieuw" className="btn-primary">+ Nieuw paard</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-card-icon">🐴</div>
          <div className="kpi-card-body">
            <div className="kpi-card-value">{horses.length}</div>
            <div className="kpi-card-label">Paarden</div>
            <div className="kpi-card-trend flat">in de stal</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-icon amber">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="12" rx="2" stroke="var(--velaro-color-warning)" strokeWidth="1.4"/>
              <path d="M5 2v4M13 2v4M2 8h14" stroke="var(--velaro-color-warning)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-value">{openTaken}</div>
            <div className="kpi-card-label">Open taken vandaag</div>
            <div className="kpi-card-trend flat">vandaag</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-icon success">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9l4 4 6-7" stroke="var(--velaro-color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-value">
              {takenVandaag.total > 0
                ? `${takenVandaag.completed}/${takenVandaag.total}`
                : '—'}
            </div>
            <div className="kpi-card-label">Taken afgerond</div>
            {takenPercentage !== null && (
              <div className={`kpi-card-trend ${takenPercentage >= 80 ? 'up' : takenPercentage >= 40 ? 'flat' : 'down'}`}>
                {takenPercentage}% voltooid
              </div>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="kpi-card">
            <div className="kpi-card-icon navy">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7" cy="6" r="3" stroke="var(--velaro-color-navy)" strokeWidth="1.4"/>
                <path d="M2 16c0-3 2-5 5-5" stroke="var(--velaro-color-navy)" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M12 11v6M9 14h6" stroke="var(--velaro-color-navy)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="kpi-card-body">
              <div className="kpi-card-value">
                <Link href="/stal/leden" style={{ color: 'inherit', textDecoration: 'none' }}>Team</Link>
              </div>
              <div className="kpi-card-label">Leden beheren</div>
              <div className="kpi-card-trend flat">medewerkers</div>
            </div>
          </div>
        )}
        {role !== null && (
          <div className="kpi-card">
            <div className={`kpi-card-icon ${verlopenZorg > 0 ? 'amber' : 'success'}`}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v5l3 3" stroke={verlopenZorg > 0 ? 'var(--velaro-color-warning)' : 'var(--velaro-color-success)'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="9" r="7" stroke={verlopenZorg > 0 ? 'var(--velaro-color-warning)' : 'var(--velaro-color-success)'} strokeWidth="1.4"/>
              </svg>
            </div>
            <div className="kpi-card-body">
              <div className="kpi-card-value" style={verlopenZorg > 0 ? { color: 'var(--velaro-color-warning)' } : undefined}>
                {verlopenZorg > 0 ? verlopenZorg : zorgActies.length}
              </div>
              <div className="kpi-card-label">
                {verlopenZorg > 0 ? 'Verlopen zorg' : 'Aankomende zorg (30d)'}
              </div>
              <div className={`kpi-card-trend ${verlopenZorg > 0 ? 'down' : 'flat'}`}>
                {verlopenZorg > 0 ? `▼ ${verlopenZorg} verlopen` : 'komende 30 dagen'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <div style={{ marginBottom: 10 }}>
          <span className="label">Snelle acties</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 14 }}>
          <Link href={`/stal/taken?datum=${toDateParam(today)}`} className="stal-actie-kaart">
            <div className="stal-actie-kaart__icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l5 5 7-8" stroke="var(--velaro-color-gold-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stal-actie-kaart__tekst">
              <div className="stal-actie-kaart__titel">Taken vandaag</div>
              <div className="stal-actie-kaart__sub">
                {openTaken > 0 ? `${openTaken} openstaand` : 'Alles gedaan'}
              </div>
            </div>
          </Link>
          <Link href="/paarden" className="stal-actie-kaart">
            <div className="stal-actie-kaart__icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <ellipse cx="10" cy="12" rx="7" ry="4" stroke="var(--velaro-color-gold-2)" strokeWidth="1.4"/>
                <path d="M7 12c0-3 1-6 3-6s3 3 3 6" stroke="var(--velaro-color-gold-2)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="stal-actie-kaart__tekst">
              <div className="stal-actie-kaart__titel">Paarden</div>
              <div className="stal-actie-kaart__sub">{horses.length} in de stal</div>
            </div>
          </Link>
          {isOwner && (
            <Link href="/stal/leden" className="stal-actie-kaart">
              <div className="stal-actie-kaart__icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="8" cy="7" r="3" stroke="var(--velaro-color-gold-2)" strokeWidth="1.4"/>
                  <path d="M3 18c0-3 2-5 5-5h4" stroke="var(--velaro-color-gold-2)" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M15 12v6M12 15h6" stroke="var(--velaro-color-gold-2)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stal-actie-kaart__tekst">
                <div className="stal-actie-kaart__titel">Team</div>
                <div className="stal-actie-kaart__sub">Beheer medewerkers</div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Aankomende zorg */}
      {role !== null && (
        <AankomendZorgPanel acties={zorgActies} />
      )}

      {/* Stalberichten */}
      {role !== null && (
        <BerichtenPanel
          target={{ stableId: stable.id }}
          title="Stalberichten"
          messages={berichten}
          canManage={isOwner}
          emptyLabel="Nog geen stalberichten."
        />
      )}

      {/* Stalbewoners */}
      {horses.length > 0 && (
        <div>
          <div style={{ marginBottom: 10 }}>
            <span className="label">Stalbewoners</span>
          </div>
          <div className="paard-kaart-grid">
            {horses.map((horse) => (
              <Link key={horse.id} href={`/paarden/${horse.id}`} className="paard-kaart">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div className="paard-kaart__naam">{horse.name}</div>
                  {horse.boxNumber && (
                    <span className="badge badge-neutral" style={{ marginLeft: 8, flexShrink: 0 }}>Box {horse.boxNumber}</span>
                  )}
                </div>
                <div className="paard-kaart__meta">
                  {[horse.breed, horse.discipline].filter(Boolean).join(' · ') || 'Geen verdere gegevens'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

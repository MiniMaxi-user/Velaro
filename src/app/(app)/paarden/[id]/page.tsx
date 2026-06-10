import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import { canViewHorse } from '@/lib/auth/authorization'
import { GESLACHT_LABELS, berekenLeeftijd, formatDatum } from '@/features/paarden/paardHelpers'
import DeletePaardButton from '@/features/paarden/DeletePaardButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaardDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const horse = await getHorse(id)
  if (!horse) notFound()

  const [canView, role] = await Promise.all([
    canViewHorse(user.id, id),
    getStableRole(user.id, horse.stableId),
  ])

  if (!canView) notFound()

  const canEdit = role !== null
  const canDelete = role === 'OWNER'

  const leeftijd = horse.dateOfBirth ? berekenLeeftijd(new Date(horse.dateOfBirth)) : null

  const velden = [
    { label: 'Ras', waarde: horse.breed },
    { label: 'Geslacht', waarde: horse.sex ? GESLACHT_LABELS[horse.sex] : null },
    {
      label: 'Geboortedatum',
      waarde: horse.dateOfBirth
        ? `${formatDatum(new Date(horse.dateOfBirth))}${leeftijd !== null ? ` (${leeftijd} jaar)` : ''}`
        : null,
    },
    { label: 'Vachtkleur', waarde: horse.color },
    { label: 'Chipnummer / UELN', waarde: horse.chipNumber },
    { label: 'Stalplek / Box', waarde: horse.boxNumber },
  ]

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/paarden" className="btn-ghost">
          ← Paarden
        </Link>
        {canEdit && (
          <Link href={`/paarden/${id}/bewerken`} className="btn-primary">
            Bewerken
          </Link>
        )}
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Paardenprofiel</div>
        <h1 className="page-title">{horse.name}</h1>
      </div>

      <div
        style={{
          background: 'var(--velaro-color-surf-1)',
          border: '1px solid var(--velaro-color-border)',
          borderRadius: 'var(--velaro-radius-lg)',
          padding: 'var(--velaro-space-8)',
          marginBottom: 'var(--velaro-space-8)',
        }}
      >
        <div className="detail-grid">
          {velden.map(({ label, waarde }) => (
            <div key={label}>
              <div className="detail-item__label">{label}</div>
              <div className="detail-item__value" style={{ color: waarde ? 'var(--white)' : 'var(--muted)' }}>
                {waarde ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {canDelete && (
        <div style={{ borderTop: '1px solid var(--velaro-color-border)', paddingTop: 'var(--velaro-space-6)' }}>
          <DeletePaardButton horseId={id} />
        </div>
      )}
    </main>
  )
}

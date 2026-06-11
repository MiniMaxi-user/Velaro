import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole, canViewHorse } from '@/lib/auth/authorization'
import { GESLACHT_LABELS, berekenLeeftijd, formatDatum } from '@/features/paarden/paardHelpers'
import DeletePaardButton from '@/features/paarden/DeletePaardButton'
import EigenaarBeheer from '@/features/paarden/EigenaarBeheer'
import { getVaccinaties, getOntwormingen, getDierenartsBezzoeken } from '@/features/gezondheid/queries'
import DeleteGezondheidButton from '@/features/gezondheid/DeleteGezondheidButton'
import { getNotesForHorse } from '@/features/mededelingen/queries'
import MededelingenSectie from '@/features/mededelingen/MededelingenSectie'
import type { Vaccination, Deworming, VetVisit } from '@prisma/client'

interface Props {
  params: Promise<{ id: string }>
}

function Veld({ label, waarde }: { label: string; waarde: string | null | undefined }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className={`detail-field-value${waarde ? '' : ' muted'}`}>{waarde ?? '—'}</div>
    </div>
  )
}

export default async function PaardDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const horse = await getHorse(id)
  if (!horse) notFound()

  const [canView, role, vaccinaties, ontwormingen, bezzoeken, notes] = await Promise.all([
    canViewHorse(user.id, id),
    getStableRole(user.id, horse.stableId),
    getVaccinaties(id),
    getOntwormingen(id),
    getDierenartsBezzoeken(id),
    getNotesForHorse(id),
  ])

  if (!canView) notFound()

  const canEdit = role !== null
  const canDelete = role === 'OWNER'

  const leeftijd = horse.dateOfBirth ? berekenLeeftijd(new Date(horse.dateOfBirth)) : null

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link href="/paarden">Paarden</Link>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{horse.name}</span>
          </div>
        </div>
        <div className="page-header-actions">
          {canEdit && (
            <Link href={`/paarden/${id}/bewerken`} className="btn-icon" title="Bewerken">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
          {canDelete && <DeletePaardButton horseId={id} />}
        </div>
      </div>

      {/* Detail header card */}
      <div className="detail-header">
        <div className="detail-header-left">
          <Link href="/paarden" className="detail-back">← Terug naar paarden</Link>
          <h1 className="detail-title">{horse.name}</h1>
          <div className="detail-meta">
            {horse.breed && <span className="badge badge-navy">{horse.breed}</span>}
            {leeftijd !== null && <span className="badge badge-neutral">{leeftijd} jaar</span>}
            {horse.sex && <span className="badge badge-neutral">{GESLACHT_LABELS[horse.sex]}</span>}
            {horse.discipline && <span className="badge badge-gold">{horse.discipline}{horse.disciplineLevel ? ` ${horse.disciplineLevel}` : ''}</span>}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="detail-layout">
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Algemeen */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Algemeen</span>
            </div>
            <div className="panel-body">
              <div className="detail-fields">
                <Veld label="Ras" waarde={horse.breed} />
                <Veld
                  label="Geboortejaar"
                  waarde={horse.dateOfBirth
                    ? `${new Date(horse.dateOfBirth).getFullYear()}${leeftijd !== null ? ` (${leeftijd} jaar)` : ''}`
                    : null}
                />
                <Veld label="Kleur" waarde={horse.color} />
                <Veld label="Geslacht" waarde={horse.sex ? GESLACHT_LABELS[horse.sex] : null} />
                <Veld label="Stalplek / Box" waarde={horse.boxNumber} />
                <Veld label="Discipline" waarde={horse.discipline} />
                {horse.disciplineLevel && <Veld label="Niveau" waarde={horse.disciplineLevel} />}
              </div>
            </div>
          </div>

          {/* Identificatie */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Identificatie</span>
            </div>
            <div className="panel-body">
              <div className="detail-fields">
                <Veld label="UELN" waarde={horse.ueln} />
                <Veld label="Chipnummer" waarde={horse.chipNumber} />
                <Veld label="Paspoortnummer" waarde={horse.passportNumber} />
              </div>
            </div>
          </div>

          {/* Afstamming */}
          {(horse.sireName || horse.damName) && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Afstamming</span>
              </div>
              <div className="panel-body">
                <div className="detail-fields">
                  <Veld label="Vader" waarde={horse.sireName} />
                  <Veld label="Moeder" waarde={horse.damName} />
                </div>
              </div>
            </div>
          )}

          {/* Vaccinaties */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Vaccinaties</span>
              {canEdit && (
                <Link href={`/paarden/${id}/vaccinaties/nieuw`} className="btn-ghost btn-ghost--sm">
                  + Toevoegen
                </Link>
              )}
            </div>
            {vaccinaties.length === 0 ? (
              <div className="gezondheid-leeg">Nog geen vaccinaties geregistreerd.</div>
            ) : (
              <table className="gezondheid-tabel">
                <thead>
                  <tr>
                    <th>Datum</th><th>Type vaccin</th><th>Volgende datum</th><th>Notities</th>
                    {canEdit && <th />}
                  </tr>
                </thead>
                <tbody>
                  {vaccinaties.map((v: Vaccination) => (
                    <tr key={v.id}>
                      <td>{formatDatum(new Date(v.date))}</td>
                      <td>{v.type}</td>
                      <td>
                        {v.nextDate
                          ? <span className="gezondheid-next">{formatDatum(new Date(v.nextDate))}</span>
                          : <span className="gezondheid-tabel__muted">—</span>}
                      </td>
                      <td className="gezondheid-tabel__muted">{v.notes ?? '—'}</td>
                      {canEdit && (
                        <td className="gezondheid-tabel__acties">
                          <Link href={`/paarden/${id}/vaccinaties/${v.id}/bewerken`} className="btn-ghost btn-ghost--sm">Bewerken</Link>
                          <DeleteGezondheidButton id={v.id} horseId={id} type="vaccinatie" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Ontworming */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Ontworming</span>
              {canEdit && (
                <Link href={`/paarden/${id}/ontworming/nieuw`} className="btn-ghost btn-ghost--sm">
                  + Toevoegen
                </Link>
              )}
            </div>
            {ontwormingen.length === 0 ? (
              <div className="gezondheid-leeg">Nog geen ontworming geregistreerd.</div>
            ) : (
              <table className="gezondheid-tabel">
                <thead>
                  <tr>
                    <th>Datum</th><th>Product</th><th>Volgende datum</th><th>Notities</th>
                    {canEdit && <th />}
                  </tr>
                </thead>
                <tbody>
                  {ontwormingen.map((o: Deworming) => (
                    <tr key={o.id}>
                      <td>{formatDatum(new Date(o.date))}</td>
                      <td>{o.product}</td>
                      <td>
                        {o.nextDate
                          ? <span className="gezondheid-next">{formatDatum(new Date(o.nextDate))}</span>
                          : <span className="gezondheid-tabel__muted">—</span>}
                      </td>
                      <td className="gezondheid-tabel__muted">{o.notes ?? '—'}</td>
                      {canEdit && (
                        <td className="gezondheid-tabel__acties">
                          <Link href={`/paarden/${id}/ontworming/${o.id}/bewerken`} className="btn-ghost btn-ghost--sm">Bewerken</Link>
                          <DeleteGezondheidButton id={o.id} horseId={id} type="ontworming" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Dierenartsenbezoeken */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Dierenartsenbezoeken</span>
              {canEdit && (
                <Link href={`/paarden/${id}/dierenarts/nieuw`} className="btn-ghost btn-ghost--sm">
                  + Toevoegen
                </Link>
              )}
            </div>
            {bezzoeken.length === 0 ? (
              <div className="gezondheid-leeg">Nog geen dierenartsenbezoeken geregistreerd.</div>
            ) : (
              <table className="gezondheid-tabel">
                <thead>
                  <tr>
                    <th>Datum</th><th>Dierenarts</th><th>Reden</th><th>Notities</th>
                    {canEdit && <th />}
                  </tr>
                </thead>
                <tbody>
                  {bezzoeken.map((b: VetVisit) => (
                    <tr key={b.id}>
                      <td>{formatDatum(new Date(b.date))}</td>
                      <td className="gezondheid-tabel__muted">{b.vet ?? '—'}</td>
                      <td>{b.reason}</td>
                      <td className="gezondheid-tabel__muted">{b.notes ?? '—'}</td>
                      {canEdit && (
                        <td className="gezondheid-tabel__acties">
                          <Link href={`/paarden/${id}/dierenarts/${b.id}/bewerken`} className="btn-ghost btn-ghost--sm">Bewerken</Link>
                          <DeleteGezondheidButton id={b.id} horseId={id} type="dierenarts" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mededelingen */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Mededelingen</span>
            </div>
            <div className="panel-body">
              <MededelingenSectie
                horseId={id}
                notes={notes}
                canCreate={canEdit}
                userId={user.id}
                isOwner={role === 'OWNER'}
              />
            </div>
          </div>

        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Welzijn */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Welzijn / EU</span>
            </div>
            <div className="panel-body">
              <div className="detail-field">
                <div className="detail-field-label">Slachtuitsluiting</div>
                <div className="detail-field-value">
                  {horse.excludedFromConsumption ? (
                    <span className="badge badge-warning">Uitgesloten</span>
                  ) : (
                    <span className="badge badge-success">Niet uitgesloten</span>
                  )}
                </div>
              </div>
              {horse.excludedFromConsumption && horse.excludedFromConsumptionDate && (
                <div className="detail-field" style={{ marginTop: 12 }}>
                  <div className="detail-field-label">Datum uitsluiting</div>
                  <div className="detail-field-value">
                    {formatDatum(new Date(horse.excludedFromConsumptionDate))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Eigenaren */}
          {canEdit && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Eigenaren</span>
              </div>
              <div className="panel-body">
                <EigenaarBeheer horseId={id} owners={horse.owners} />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

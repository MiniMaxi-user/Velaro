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
import type { Vaccination, Deworming, VetVisit } from '@prisma/client'

interface Props {
  params: Promise<{ id: string }>
}

function ProfielSectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="profiel-sectie">
      <div className="profiel-sectie__header">
        <span className="profiel-sectie__titel">{titel}</span>
      </div>
      <div className="detail-grid profiel-sectie__body">{children}</div>
    </div>
  )
}

function Veld({ label, waarde }: { label: string; waarde: string | null | undefined }) {
  return (
    <div>
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value" style={{ color: waarde ? 'var(--white)' : 'var(--muted)' }}>
        {waarde ?? '—'}
      </div>
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

  const [canView, role, vaccinaties, ontwormingen, bezzoeken] = await Promise.all([
    canViewHorse(user.id, id),
    getStableRole(user.id, horse.stableId),
    getVaccinaties(id),
    getOntwormingen(id),
    getDierenartsBezzoeken(id),
  ])

  if (!canView) notFound()

  const canEdit = role !== null
  const canDelete = role === 'OWNER'

  const leeftijd = horse.dateOfBirth ? berekenLeeftijd(new Date(horse.dateOfBirth)) : null

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/paarden" className="btn-ghost">← Paarden</Link>
        {canEdit && (
          <Link href={`/paarden/${id}/bewerken`} className="btn-primary">Bewerken</Link>
        )}
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Paardenprofiel</div>
        <h1 className="page-title">{horse.name}</h1>
      </div>

      {/* Sectie: Algemeen */}
      <ProfielSectie titel="Algemeen">
        <Veld label="Ras" waarde={horse.breed} />
        <Veld label="Geslacht" waarde={horse.sex ? GESLACHT_LABELS[horse.sex] : null} />
        <Veld
          label="Geboortedatum"
          waarde={horse.dateOfBirth
            ? `${formatDatum(new Date(horse.dateOfBirth))}${leeftijd !== null ? ` (${leeftijd} jaar)` : ''}`
            : null}
        />
        <Veld label="Vachtkleur" waarde={horse.color} />
        <Veld label="Stalplek / Box" waarde={horse.boxNumber} />
      </ProfielSectie>

      {/* Sectie: Identificatie */}
      <ProfielSectie titel="Identificatie">
        <Veld label="Chipnummer" waarde={horse.chipNumber} />
        <Veld label="UELN" waarde={horse.ueln} />
        <Veld label="Paspoortnummer" waarde={horse.passportNumber} />
      </ProfielSectie>

      {/* Sectie: Afstamming */}
      <ProfielSectie titel="Afstamming">
        <Veld label="Vader" waarde={horse.sireName} />
        <Veld label="Moeder" waarde={horse.damName} />
      </ProfielSectie>

      {/* Sectie: Sport */}
      <ProfielSectie titel="Sport">
        <Veld label="Discipline" waarde={horse.discipline} />
        <Veld label="Niveau" waarde={horse.disciplineLevel} />
      </ProfielSectie>

      {/* Sectie: Welzijn / EU */}
      <ProfielSectie titel="Welzijn / EU">
        <Veld
          label="Slachtuitsluiting"
          waarde={horse.excludedFromConsumption ? 'Uitgesloten' : 'Niet uitgesloten'}
        />
        {horse.excludedFromConsumption && (
          <Veld
            label="Datum uitsluiting"
            waarde={horse.excludedFromConsumptionDate
              ? formatDatum(new Date(horse.excludedFromConsumptionDate))
              : null}
          />
        )}
      </ProfielSectie>

      {/* Gezondheidsregistratie */}
      <div style={{ margin: 'var(--velaro-space-10) 0 var(--velaro-space-4)' }}>
        <div className="label">Gezondheid</div>
      </div>

      {/* Vaccinaties */}
      <div className="gezondheid-sectie">
        <div className="gezondheid-sectie__header">
          <span className="gezondheid-sectie__titel">Vaccinaties</span>
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
                <th>Datum</th><th>Type vaccin</th><th>Volgende</th><th>Notities</th>
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
      <div className="gezondheid-sectie">
        <div className="gezondheid-sectie__header">
          <span className="gezondheid-sectie__titel">Ontworming</span>
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
                <th>Datum</th><th>Product</th><th>Volgende</th><th>Notities</th>
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
      <div className="gezondheid-sectie">
        <div className="gezondheid-sectie__header">
          <span className="gezondheid-sectie__titel">Dierenartsenbezoeken</span>
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
                      <DeleteGezondheidButton id={b.id} horseId={id} type="dierenarts" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Eigenarenbeheer — alleen stalpersoneel */}
      {canEdit && (
        <div style={{ marginTop: 'var(--velaro-space-10)' }}>
          <div className="label">Eigenaren</div>
          <EigenaarBeheer horseId={id} owners={horse.owners} />
        </div>
      )}

      {canDelete && (
        <div style={{ borderTop: '1px solid var(--velaro-color-border)', paddingTop: 'var(--velaro-space-6)', marginTop: 'var(--velaro-space-8)' }}>
          <DeletePaardButton horseId={id} />
        </div>
      )}
    </main>
  )
}

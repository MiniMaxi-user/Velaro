'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { addHorseOwner, removeHorseOwner, removeHorseRider } from './actions'
import { berekenLeeftijd, isMinderjarig } from './paardHelpers'

type Owner = { id: string; userId: string; user: { name: string | null; email: string } }
type Rider = {
  id: string
  name: string
  dateOfBirth: Date | string | null
  phone: string | null
  email: string | null
  notes: string | null
}

// Eén regel in het gecombineerde overzicht. Een persoon kan eigenaar, bereider of
// beide zijn. Eigenaar en bereider worden gematcht op (genormaliseerd) e-mailadres
// zodat dezelfde persoon als één regel met twee rollen verschijnt.
type Persoon = {
  key: string
  naam: string
  email: string | null
  telefoon: string | null
  owner: Owner | null
  rider: Rider | null
}

function normEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

function combineer(owners: Owner[], riders: Rider[]): Persoon[] {
  const personen: Persoon[] = []
  const ownerIndexByEmail = new Map<string, number>()

  for (const o of owners) {
    const email = normEmail(o.user.email)
    const persoon: Persoon = {
      key: `owner-${o.id}`,
      naam: o.user.name ?? o.user.email,
      email: o.user.email,
      telefoon: null,
      owner: o,
      rider: null,
    }
    if (email) ownerIndexByEmail.set(email, personen.length)
    personen.push(persoon)
  }

  for (const r of riders) {
    const email = normEmail(r.email)
    const matchIndex = email != null ? ownerIndexByEmail.get(email) : undefined
    if (matchIndex != null) {
      // Dezelfde persoon is ook eigenaar: voeg de bereiderrol toe aan de bestaande regel.
      personen[matchIndex].rider = r
      personen[matchIndex].telefoon = r.phone
    } else {
      personen.push({
        key: `rider-${r.id}`,
        naam: r.name,
        email: r.email,
        telefoon: r.phone,
        owner: null,
        rider: r,
      })
    }
  }

  return personen
}

export default function EigenaarBereiderBeheer({ horseId, owners, riders }: {
  horseId: string
  owners: Owner[]
  riders: Rider[]
}) {
  const [addError, setAddError] = useState<string | null>(null)
  const [addPending, startAdd] = useTransition()
  const [actieError, setActieError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const personen = combineer(owners, riders)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddError(null)
    const fd = new FormData(e.currentTarget)
    startAdd(async () => {
      const result = await addHorseOwner(horseId, fd)
      if (result?.error) {
        setAddError(result.error)
      } else {
        formRef.current?.reset()
      }
    })
  }

  async function handleRemoveOwner(ownershipId: string, naam: string) {
    if (!confirm('Weet je zeker dat je ' + naam + ' als eigenaar wilt ontkoppelen?')) return
    setActieError(null)
    const result = await removeHorseOwner(horseId, ownershipId)
    if (result?.error) setActieError(result.error)
  }

  async function handleRemoveRider(riderId: string, naam: string) {
    if (!confirm('Weet je zeker dat je bereider ' + naam + ' wilt verwijderen?')) return
    setActieError(null)
    const result = await removeHorseRider(horseId, riderId)
    if (result?.error) setActieError(result.error)
  }

  return (
    <div className="gezondheid-sectie">
      <div className="gezondheid-sectie__header">
        <span className="gezondheid-sectie__titel">Eigenaren &amp; bereiders</span>
      </div>

      {personen.length === 0 ? (
        <div className="gezondheid-leeg">Nog geen eigenaren of bereiders gekoppeld.</div>
      ) : (
        <table className="gezondheid-tabel">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Rol</th>
              <th>Telefoon</th>
              <th>E-mailadres</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {personen.map((p) => {
              const rider = p.rider
              const dob = rider?.dateOfBirth ? new Date(rider.dateOfBirth) : null
              const minor = isMinderjarig(dob)
              const leeftijd = dob ? berekenLeeftijd(dob) : null
              return (
                <tr key={p.key}>
                  <td>
                    {p.naam}
                    {minor === true && (
                      <span className="badge badge-warning" style={{ marginLeft: 8 }}>Minderjarig</span>
                    )}
                    {leeftijd !== null && (
                      <span className="gezondheid-tabel__muted" style={{ marginLeft: 8 }}>{leeftijd} jaar</span>
                    )}
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.owner && <span className="badge badge-gold">Eigenaar</span>}
                      {p.rider && <span className="badge badge-navy">Bereider</span>}
                    </span>
                  </td>
                  <td className="gezondheid-tabel__muted">{p.telefoon ?? '—'}</td>
                  <td className="gezondheid-tabel__muted">{p.email ?? '—'}</td>
                  <td className="gezondheid-tabel__acties">
                    {p.owner && (
                      <>
                        <Link
                          href={`/paarden/${horseId}/eigenaren/${p.owner.id}/bewerken`}
                          className="btn-icon"
                          title={`Eigenaarsgegevens van ${p.naam} bewerken`}
                          aria-label="Eigenaar bewerken"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                        <button
                          type="button"
                          className="btn-icon btn-icon--danger"
                          title="Eigenaar ontkoppelen"
                          aria-label="Eigenaar ontkoppelen"
                          onClick={() => handleRemoveOwner(p.owner!.id, p.naam)}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7h6.6L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </>
                    )}
                    {p.rider && (
                      <>
                        <Link
                          href={`/paarden/${horseId}/bereiders/${p.rider.id}/bewerken`}
                          className="btn-icon"
                          title={`Bereidersgegevens van ${p.naam} bewerken`}
                          aria-label="Bereider bewerken"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                        <button
                          type="button"
                          className="btn-icon btn-icon--danger"
                          title="Bereider verwijderen"
                          aria-label="Bereider verwijderen"
                          onClick={() => handleRemoveRider(p.rider!.id, p.naam)}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7h6.6L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {actieError && (
        <div className="form-feedback form-feedback--error" style={{ margin: 'var(--velaro-space-4) var(--velaro-space-6)' }}>
          {actieError}
        </div>
      )}

      <div style={{ padding: 'var(--velaro-space-5) var(--velaro-space-6)', borderTop: '1px solid var(--velaro-color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--velaro-space-4)' }}>
        <div>
          {addError && <div className="form-feedback form-feedback--error" style={{ marginBottom: 'var(--velaro-space-4)' }}>{addError}</div>}
          <form ref={formRef} onSubmit={handleAdd} className="leden-add-row">
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <input
                name="email"
                type="email"
                className="input"
                placeholder="E-mailadres eigenaar"
                required
                autoComplete="off"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={addPending}>
              {addPending ? '...' : 'Eigenaar koppelen'}
            </button>
          </form>
          <div style={{ marginTop: 'var(--velaro-space-3)', fontSize: 'var(--velaro-text-xs)', color: 'var(--velaro-color-muted)' }}>
            Nog geen account?{' '}
            <Link href={`/paarden/${horseId}/eigenaren/nieuw`} className="form-link">
              Maak een account aan
            </Link>
          </div>
        </div>

        <div>
          <Link href={`/paarden/${horseId}/bereiders/nieuw`} className="btn-secondary">
            Bereider toevoegen
          </Link>
        </div>
      </div>
    </div>
  )
}

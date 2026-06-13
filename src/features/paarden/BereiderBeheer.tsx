'use client'

import Link from 'next/link'
import { useState } from 'react'
import { removeHorseRider } from './actions'
import { berekenLeeftijd, isMinderjarig } from './paardHelpers'

type Rider = {
  id: string
  name: string
  dateOfBirth: Date | string | null
  phone: string | null
  email: string | null
  notes: string | null
}

export default function BereiderBeheer({ horseId, riders }: {
  horseId: string
  riders: Rider[]
}) {
  const [removeError, setRemoveError] = useState<string | null>(null)

  async function handleRemove(riderId: string, naam: string) {
    if (!confirm('Weet je zeker dat je bereider ' + naam + ' wilt verwijderen?')) return
    setRemoveError(null)
    const result = await removeHorseRider(horseId, riderId)
    if (result?.error) {
      setRemoveError(result.error)
    }
  }

  return (
    <div className="gezondheid-sectie">
      <div className="gezondheid-sectie__header">
        <span className="gezondheid-sectie__titel">Bereiders</span>
      </div>

      {riders.length === 0 ? (
        <div className="gezondheid-leeg">Nog geen bereiders toegevoegd.</div>
      ) : (
        <table className="gezondheid-tabel">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Telefoon</th>
              <th>E-mailadres</th>
              <th>Leeftijd / notitie</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {riders.map((r) => {
              const dob = r.dateOfBirth ? new Date(r.dateOfBirth) : null
              const minor = isMinderjarig(dob)
              const leeftijd = dob ? berekenLeeftijd(dob) : null
              return (
                <tr key={r.id}>
                  <td>
                    {r.name}
                    {minor === true && (
                      <span className="badge badge-warning" style={{ marginLeft: 8 }}>Minderjarig</span>
                    )}
                  </td>
                  <td className="gezondheid-tabel__muted">{r.phone ?? '—'}</td>
                  <td className="gezondheid-tabel__muted">{r.email ?? '—'}</td>
                  <td className="gezondheid-tabel__muted">
                    {leeftijd !== null ? `${leeftijd} jaar` : ''}
                    {leeftijd !== null && r.notes ? ' · ' : ''}
                    {r.notes ?? (leeftijd === null ? '—' : '')}
                  </td>
                  <td className="gezondheid-tabel__acties">
                    <Link
                      href={`/paarden/${horseId}/bereiders/${r.id}/bewerken`}
                      className="btn-icon"
                      title={`Gegevens van ${r.name} bewerken`}
                      aria-label="Bereider bewerken"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                    <button
                      type="button"
                      className="btn-icon btn-icon--danger"
                      title="Verwijderen"
                      aria-label="Verwijderen"
                      onClick={() => handleRemove(r.id, r.name)}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7h6.6L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {removeError && (
        <div className="form-feedback form-feedback--error" style={{ margin: 'var(--velaro-space-4) var(--velaro-space-6)' }}>
          {removeError}
        </div>
      )}

      <div style={{ padding: 'var(--velaro-space-5) var(--velaro-space-6)', borderTop: '1px solid var(--velaro-color-border)' }}>
        <Link href={`/paarden/${horseId}/bereiders/nieuw`} className="btn-primary">
          Bereider toevoegen
        </Link>
      </div>
    </div>
  )
}

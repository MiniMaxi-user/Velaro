'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { addHorsePerson, toggleHorsePersonRole, removeHorsePerson } from './actions'

type Person = {
  id: string
  isOwner: boolean
  isRider: boolean
  user: { id: string; name: string | null; email: string }
}

function RolBadge({
  actief,
  label,
  pending,
  onClick,
}: {
  actief: boolean
  label: string
  pending: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`badge ${actief ? 'badge-gold' : 'badge-neutral'}`}
      style={{
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.6 : actief ? 1 : 0.55,
        border: 'none',
      }}
      aria-pressed={actief}
      title={`${label} ${actief ? 'uitzetten' : 'aanzetten'}`}
      disabled={pending}
      onClick={onClick}
    >
      {actief ? '✓ ' : ''}
      {label}
    </button>
  )
}

export default function PersonenBeheer({ horseId, people }: {
  horseId: string
  people: Person[]
}) {
  const [addError, setAddError] = useState<string | null>(null)
  const [addPending, startAdd] = useTransition()
  const [rowError, setRowError] = useState<string | null>(null)
  const [pendingRow, setPendingRow] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [addOwner, setAddOwner] = useState(true)
  const [addRider, setAddRider] = useState(false)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddError(null)
    if (!addOwner && !addRider) {
      setAddError('Kies minstens één rol (eigenaar of bereider).')
      return
    }
    const fd = new FormData(e.currentTarget)
    fd.set('isOwner', addOwner ? 'true' : 'false')
    fd.set('isRider', addRider ? 'true' : 'false')
    startAdd(async () => {
      const result = await addHorsePerson(horseId, fd)
      if (result?.error) {
        setAddError(result.error)
      } else {
        formRef.current?.reset()
        setAddOwner(true)
        setAddRider(false)
      }
    })
  }

  async function handleToggle(person: Person, role: 'owner' | 'rider') {
    setRowError(null)
    setPendingRow(person.id)
    const enabled = role === 'owner' ? !person.isOwner : !person.isRider
    const result = await toggleHorsePersonRole(horseId, person.id, role, enabled)
    setPendingRow(null)
    if (result?.error) setRowError(result.error)
  }

  async function handleRemove(person: Person) {
    const naam = person.user.name ?? person.user.email
    if (!confirm(`Weet je zeker dat je ${naam} wilt ontkoppelen van dit paard?`)) return
    setRowError(null)
    setPendingRow(person.id)
    const result = await removeHorsePerson(horseId, person.id)
    setPendingRow(null)
    if (result?.error) setRowError(result.error)
  }

  return (
    <div className="gezondheid-sectie">
      <div className="gezondheid-sectie__header">
        <span className="gezondheid-sectie__titel">Eigenaren &amp; bereiders</span>
      </div>

      {people.length === 0 ? (
        <div className="gezondheid-leeg">Nog geen personen gekoppeld.</div>
      ) : (
        <table className="gezondheid-tabel">
          <thead>
            <tr>
              <th>Naam</th>
              <th>E-mailadres</th>
              <th>Rollen</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {people.map((p) => {
              const busy = pendingRow === p.id
              return (
                <tr key={p.id}>
                  <td>{p.user.name ?? '—'}</td>
                  <td className="gezondheid-tabel__muted">{p.user.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <RolBadge
                        actief={p.isOwner}
                        label="Eigenaar"
                        pending={busy}
                        onClick={() => handleToggle(p, 'owner')}
                      />
                      <RolBadge
                        actief={p.isRider}
                        label="Bereider"
                        pending={busy}
                        onClick={() => handleToggle(p, 'rider')}
                      />
                    </div>
                  </td>
                  <td className="gezondheid-tabel__acties">
                    <button
                      type="button"
                      className="btn-icon btn-icon--danger"
                      title="Ontkoppelen"
                      aria-label="Ontkoppelen"
                      disabled={busy}
                      onClick={() => handleRemove(p)}
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

      {rowError && (
        <div className="form-feedback form-feedback--error" style={{ margin: 'var(--velaro-space-4) var(--velaro-space-6)' }}>
          {rowError}
        </div>
      )}

      <div style={{ padding: 'var(--velaro-space-5) var(--velaro-space-6)', borderTop: '1px solid var(--velaro-color-border)' }}>
        {addError && <div className="form-feedback form-feedback--error" style={{ marginBottom: 'var(--velaro-space-4)' }}>{addError}</div>}
        <form ref={formRef} onSubmit={handleAdd} className="leden-add-row">
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <input
              name="email"
              type="email"
              className="input"
              placeholder="E-mailadres persoon"
              required
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={addPending}>
            {addPending ? '...' : 'Koppelen'}
          </button>
        </form>
        <div style={{ display: 'flex', gap: 16, marginTop: 'var(--velaro-space-3)', fontSize: 'var(--velaro-text-sm)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={addOwner}
              onChange={(e) => setAddOwner(e.target.checked)}
            />
            Eigenaar
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={addRider}
              onChange={(e) => setAddRider(e.target.checked)}
            />
            Bereider
          </label>
        </div>
        <div style={{ marginTop: 'var(--velaro-space-3)', fontSize: 'var(--velaro-text-xs)', color: 'var(--velaro-color-muted)' }}>
          Nog geen account?{' '}
          <Link href={`/paarden/${horseId}/personen/nieuw`} className="form-link">
            Maak een account aan
          </Link>
        </div>
      </div>
    </div>
  )
}

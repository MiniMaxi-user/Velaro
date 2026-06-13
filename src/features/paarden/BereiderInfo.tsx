'use client'

import { useState, useTransition } from 'react'
import { updateRiderPhone } from './actions'
import { isMinderjarig } from './paardHelpers'

type Owner = { id: string; user: { name: string | null; email: string } }
type Rider = {
  id: string
  name: string
  dateOfBirth: Date | string | null
  phone: string | null
  email: string | null
}

function RiderPhoneRow({ horseId, rider }: { horseId: string; rider: Rider }) {
  const [phone, setPhone] = useState(rider.phone ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const fd = new FormData()
    fd.set('phone', phone)
    startTransition(async () => {
      const result = await updateRiderPhone(horseId, rider.id, fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  const minor = isMinderjarig(rider.dateOfBirth ? new Date(rider.dateOfBirth) : null)

  return (
    <div className="detail-field" style={{ marginBottom: 16 }}>
      <div className="detail-field-label">
        {rider.name}
        {minor === true && <span className="badge badge-warning" style={{ marginLeft: 8 }}>Minderjarig</span>}
      </div>
      {rider.email && (
        <div className="detail-field-value muted" style={{ fontSize: 'var(--velaro-text-sm)' }}>{rider.email}</div>
      )}
      <form onSubmit={handleSave} className="leden-add-row" style={{ marginTop: 8 }}>
        <div className="form-group" style={{ flex: 1, margin: 0 }}>
          <input
            name="phone"
            type="tel"
            className="input"
            placeholder="Telefoonnummer"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? '...' : 'Opslaan'}
        </button>
      </form>
      {saved && (
        <div className="detail-field-value muted" style={{ fontSize: 'var(--velaro-text-xs)', marginTop: 4 }}>
          Telefoonnummer opgeslagen.
        </div>
      )}
      {error && (
        <div className="form-feedback form-feedback--error" style={{ marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}

export default function BereiderInfo({ horseId, owners, riders }: {
  horseId: string
  owners: Owner[]
  riders: Rider[]
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Eigenaar &amp; bereider</span>
      </div>
      <div className="panel-body">
        <div className="detail-field" style={{ marginBottom: 20 }}>
          <div className="detail-field-label">Eigenaar(s)</div>
          {owners.length === 0 ? (
            <div className="detail-field-value muted">—</div>
          ) : (
            owners.map((o) => (
              <div key={o.id} className="detail-field-value">
                {o.user.name ?? o.user.email}
                {o.user.name && (
                  <span className="muted" style={{ marginLeft: 8, fontSize: 'var(--velaro-text-sm)' }}>{o.user.email}</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="detail-field-label" style={{ marginBottom: 8 }}>Bereider(s)</div>
        {riders.length === 0 ? (
          <div className="detail-field-value muted">Nog geen bereiders.</div>
        ) : (
          riders.map((r) => <RiderPhoneRow key={r.id} horseId={horseId} rider={r} />)
        )}
      </div>
    </div>
  )
}

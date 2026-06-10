'use client'

import Link from 'next/link'
import { createDierenartsBeezoek } from './actions'
import SubmitButton from '@/components/SubmitButton'

export default function DierenartsBezoekreForm({ horseId }: { horseId: string }) {
  const action = createDierenartsBeezoek.bind(null, horseId)

  return (
    <form action={action} className="form-card">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="date" className="form-label">Datum *</label>
          <input id="date" name="date" type="date" className="input" required />
        </div>

        <div className="form-group">
          <label htmlFor="vet" className="form-label">Dierenarts</label>
          <input
            id="vet"
            name="vet"
            type="text"
            className="input"
            placeholder="bv. Dr. Janssen"
          />
        </div>

        <div className="form-group form-grid--full">
          <label htmlFor="reason" className="form-label">Reden *</label>
          <input
            id="reason"
            name="reason"
            type="text"
            className="input"
            placeholder="bv. Kreupelheidsonderzoek"
            required
          />
        </div>

        <div className="form-group form-grid--full">
          <label htmlFor="notes" className="form-label">Behandeling / notities</label>
          <textarea id="notes" name="notes" className="input" rows={3} />
        </div>
      </div>

      <div className="action-buttons">
        <SubmitButton label="Opslaan" />
        <Link href={`/paarden/${horseId}`} className="btn-ghost">Annuleren</Link>
      </div>
    </form>
  )
}

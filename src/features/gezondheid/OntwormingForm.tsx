'use client'

import Link from 'next/link'
import { createOntworming } from './actions'
import SubmitButton from '@/components/SubmitButton'

export default function OntwormingForm({ horseId }: { horseId: string }) {
  const action = createOntworming.bind(null, horseId)

  return (
    <form action={action} className="form-card">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="date" className="form-label">Datum *</label>
          <input id="date" name="date" type="date" className="input" required />
        </div>

        <div className="form-group">
          <label htmlFor="product" className="form-label">Product / middel *</label>
          <input
            id="product"
            name="product"
            type="text"
            className="input"
            placeholder="bv. Eqvalan, Panacur"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="nextDate" className="form-label">Volgende ontworming</label>
          <input id="nextDate" name="nextDate" type="date" className="input" />
        </div>

        <div className="form-group form-grid--full">
          <label htmlFor="notes" className="form-label">Notities</label>
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

'use client'

import type { Horse } from '@prisma/client'
import { createHorse, updateHorse } from './actions'
import { GESLACHT_LABELS, formatDateForInput } from './paardHelpers'
import SubmitButton from '@/components/SubmitButton'
import Link from 'next/link'

interface Props {
  horse?: Horse
}

export default function PaardForm({ horse }: Props) {
  const action = horse ? updateHorse.bind(null, horse.id) : createHorse
  const cancelHref = horse ? `/paarden/${horse.id}` : '/paarden'

  return (
    <form action={action} className="form-card">
      <div className="form-grid">
        <div className="form-group form-grid--full">
          <label htmlFor="name" className="form-label">Naam *</label>
          <input
            id="name"
            name="name"
            type="text"
            className="input"
            placeholder="bv. Shadowfax"
            defaultValue={horse?.name ?? ''}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="breed" className="form-label">Ras</label>
          <input
            id="breed"
            name="breed"
            type="text"
            className="input"
            placeholder="bv. KWPN"
            defaultValue={horse?.breed ?? ''}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sex" className="form-label">Geslacht</label>
          <select id="sex" name="sex" className="input" defaultValue={horse?.sex ?? ''}>
            <option value="">— selecteer —</option>
            {(Object.keys(GESLACHT_LABELS) as Array<keyof typeof GESLACHT_LABELS>).map((key) => (
              <option key={key} value={key}>
                {GESLACHT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth" className="form-label">Geboortedatum</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            className="input"
            defaultValue={formatDateForInput(horse?.dateOfBirth ?? null)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="color" className="form-label">Vachtkleur</label>
          <input
            id="color"
            name="color"
            type="text"
            className="input"
            placeholder="bv. Zwart"
            defaultValue={horse?.color ?? ''}
          />
        </div>

        <div className="form-group">
          <label htmlFor="chipNumber" className="form-label">Chipnummer / UELN</label>
          <input
            id="chipNumber"
            name="chipNumber"
            type="text"
            className="input"
            placeholder="bv. 528003000000000"
            defaultValue={horse?.chipNumber ?? ''}
          />
        </div>

        <div className="form-group">
          <label htmlFor="boxNumber" className="form-label">Stalplek / Box</label>
          <input
            id="boxNumber"
            name="boxNumber"
            type="text"
            className="input"
            placeholder="bv. B12"
            defaultValue={horse?.boxNumber ?? ''}
          />
        </div>
      </div>

      <div className="action-buttons">
        <SubmitButton label={horse ? 'Wijzigingen opslaan' : 'Paard aanmaken'} />
        <Link href={cancelHref} className="btn-ghost">
          Annuleren
        </Link>
      </div>
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import type { FeedingPlan } from '@prisma/client'
import { saveFeedingPlan } from './actions'
import SubmitButton from '@/components/SubmitButton'

interface Props {
  horseId: string
  plan: FeedingPlan | null
  canEdit: boolean
}

type State = { error?: string; saved?: boolean }

const VELDEN: { key: keyof FeedingPlan; label: string; placeholder: string }[] = [
  { key: 'roughage', label: 'Ruwvoer', placeholder: 'bv. 3x daags hooi' },
  { key: 'concentrate', label: 'Krachtvoer', placeholder: 'bv. 2 scheppen muesli ochtend en avond' },
  { key: 'supplements', label: 'Supplementen', placeholder: 'bv. maagsupplement bij ontbijt' },
  { key: 'notes', label: 'Opmerkingen', placeholder: 'overige opmerkingen' },
]

export default function VoederschemaPanel({ horseId, plan, canEdit }: Props) {
  async function action(_prev: State, formData: FormData): Promise<State> {
    const res = await saveFeedingPlan(horseId, formData)
    if (res?.error) return { error: res.error }
    return { saved: true }
  }

  const [state, formAction] = useActionState(action, {})

  if (!canEdit) {
    const heeftBeperkingen = !!plan?.restrictions
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Voederschema</span>
        </div>
        <div className="panel-body">
          <div className="detail-fields">
            {VELDEN.map((v) => (
              <Veld key={v.key} label={v.label} waarde={plan?.[v.key] as string | null} />
            ))}
          </div>
          <div className="detail-field" style={{ marginTop: 12 }}>
            <div className="detail-field-label">Beperkingen / allergie</div>
            <div className={`detail-field-value${heeftBeperkingen ? '' : ' muted'}`}>
              {heeftBeperkingen ? (
                <span className="badge badge-danger">{plan!.restrictions}</span>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Voederschema</span>
      </div>
      <div className="panel-body">
        <form action={formAction} className="form-grid">
          {state.error && (
            <div className="form-feedback form-feedback--error form-grid--full">{state.error}</div>
          )}
          {state.saved && (
            <div className="form-feedback form-feedback--success form-grid--full">
              Voederschema opgeslagen.
            </div>
          )}

          {VELDEN.map((v) => (
            <div key={v.key} className="form-group form-grid--full">
              <label htmlFor={v.key} className="form-label">{v.label}</label>
              <textarea
                id={v.key}
                name={v.key}
                className="input"
                placeholder={v.placeholder}
                defaultValue={(plan?.[v.key] as string | null) ?? ''}
                rows={2}
              />
            </div>
          ))}

          <div className="form-group form-grid--full">
            <label htmlFor="restrictions" className="form-label">
              Beperkingen / allergie
            </label>
            <textarea
              id="restrictions"
              name="restrictions"
              className="input"
              placeholder="bv. geen suikerrijk voer"
              defaultValue={plan?.restrictions ?? ''}
              rows={2}
            />
            <span className="form-hint">
              Een voerbeperking is veiligheidskritisch en wordt extra benadrukt.
            </span>
          </div>

          <div className="action-buttons form-grid--full">
            <SubmitButton label="Voederschema opslaan" />
          </div>
        </form>
      </div>
    </div>
  )
}

function Veld({ label, waarde }: { label: string; waarde: string | null | undefined }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className={`detail-field-value${waarde ? '' : ' muted'}`}>{waarde ?? '—'}</div>
    </div>
  )
}

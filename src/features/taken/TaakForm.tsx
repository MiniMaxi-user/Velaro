'use client'

import { useRef, useState, useTransition } from 'react'
import { createTask } from './actions'

type Horse = { id: string; name: string }

export default function TaakForm({ date, horses }: { date: string; horses: Horse[] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createTask(fd)
        formRef.current?.reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="taak-form">
      {error && <div className="form-feedback form-feedback--error">{error}</div>}
      <input type="hidden" name="date" value={date} />
      <div className="taak-form__row">
        <div className="form-group" style={{ flex: 1, margin: 0 }}>
          <input
            name="title"
            className="input"
            placeholder="Nieuwe taak omschrijven..."
            required
            autoComplete="off"
          />
        </div>
        {horses.length > 0 && (
          <div className="form-group" style={{ margin: 0 }}>
            <select name="horseId" className="input select--taak">
              <option value="">Geen paard</option>
              {horses.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? '...' : 'Toevoegen'}
        </button>
      </div>
    </form>
  )
}

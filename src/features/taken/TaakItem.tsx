'use client'

import { useState, useTransition } from 'react'
import { toggleTask, deleteTask } from './actions'

type Task = {
  id: string
  title: string
  isCompleted: boolean
  horse: { id: string; name: string } | null
}

export default function TaakItem({ task }: { task: Task }) {
  const [error, setError] = useState<string | null>(null)
  const [toggling, startToggle] = useTransition()
  const [deleting, startDelete] = useTransition()

  function handleToggle() {
    setError(null)
    startToggle(async () => {
      try { await toggleTask(task.id) }
      catch (err) { setError(err instanceof Error ? err.message : 'Fout') }
    })
  }

  function handleDelete() {
    setError(null)
    startDelete(async () => {
      try { await deleteTask(task.id) }
      catch (err) { setError(err instanceof Error ? err.message : 'Fout') }
    })
  }

  return (
    <div className={`taak-item${task.isCompleted ? ' taak-item--done' : ''}`}>
      <button
        type="button"
        className="taak-item__check"
        onClick={handleToggle}
        disabled={toggling}
        aria-label={task.isCompleted ? 'Markeer als openstaand' : 'Markeer als gedaan'}
      >
        {task.isCompleted ? '✓' : ''}
      </button>
      <div className="taak-item__body">
        <span className="taak-item__title">{task.title}</span>
        {task.horse && (
          <span className="taak-item__paard">{task.horse.name}</span>
        )}
        {error && <span className="taak-item__error">{error}</span>}
      </div>
      <button
        type="button"
        className="btn-danger btn-danger--sm taak-item__delete"
        onClick={handleDelete}
        disabled={deleting}
      >
        Verwijder
      </button>
    </div>
  )
}

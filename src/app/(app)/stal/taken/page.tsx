import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserStable } from '@/features/paarden/queries'
import { getHorsesForStable } from '@/features/paarden/queries'
import { getTasksForDate } from '@/features/taken/queries'
import TaakForm from '@/features/taken/TaakForm'
import TaakItem from '@/features/taken/TaakItem'

function formatDate(d: Date) {
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function toDateParam(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default async function TakenPage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stable = await getUserStable(user.id)
  if (!stable) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <div className="empty-state__title">Geen stal gevonden</div>
          <p>Je bent nog niet aan een stal gekoppeld.</p>
        </div>
      </main>
    )
  }

  const { datum } = await searchParams
  const date = datum ? new Date(datum) : new Date()
  date.setHours(12, 0, 0, 0)

  const prev = new Date(date)
  prev.setDate(prev.getDate() - 1)
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const isToday = toDateParam(date) === toDateParam(today)

  const [tasks, horses] = await Promise.all([
    getTasksForDate(stable.id, date),
    getHorsesForStable(stable.id),
  ])

  const open = tasks.filter((t) => !t.isCompleted)
  const done = tasks.filter((t) => t.isCompleted)

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <div className="label">Stal — {stable.name}</div>
          <h1 className="page-title">
            Dagelijkse <em>taken</em>
          </h1>
        </div>
        <Link href="/stal" className="btn-ghost">← Stal</Link>
      </div>

      <div className="taken-nav">
        <Link href={`/stal/taken?datum=${toDateParam(prev)}`} className="btn-ghost btn-ghost--sm">
          ← {prev.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
        </Link>
        <div className="taken-nav__datum">
          <span className="taken-nav__dag">{formatDate(date)}</span>
          {isToday && <span className="leden-badge leden-badge--owner">vandaag</span>}
        </div>
        <Link href={`/stal/taken?datum=${toDateParam(next)}`} className="btn-ghost btn-ghost--sm">
          {next.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} →
        </Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-6)' }}>
        <TaakForm
          date={toDateParam(date)}
          horses={horses.map((h) => ({ id: h.id, name: h.name }))}
        />
      </div>

      {open.length === 0 && done.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__title">Geen taken</div>
          <p>Voeg hierboven een taak toe voor deze dag.</p>
        </div>
      )}

      {open.length > 0 && (
        <div className="taken-sectie">
          <div className="taken-sectie__header">
            <span className="gezondheid-sectie__titel">Openstaand — {open.length}</span>
          </div>
          <div className="taken-lijst">
            {open.map((task) => (
              <TaakItem key={task.id} task={task} horses={horses.map((h) => ({ id: h.id, name: h.name }))} />
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="taken-sectie" style={{ marginTop: 'var(--velaro-space-5)' }}>
          <div className="taken-sectie__header">
            <span className="gezondheid-sectie__titel">Gedaan — {done.length}</span>
          </div>
          <div className="taken-lijst">
            {done.map((task) => (
              <TaakItem key={task.id} task={task} horses={horses.map((h) => ({ id: h.id, name: h.name }))} />
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

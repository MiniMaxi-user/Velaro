import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getUserStable } from '@/features/paarden/queries'
import { getHorsesForStable } from '@/features/paarden/queries'
import { getTasksForDate, getRecurringTasksForStable } from '@/features/taken/queries'
import { ensureRecurringTasksForDate } from '@/features/taken/actions'
import TaakForm from '@/features/taken/TaakForm'
import TaakItem from '@/features/taken/TaakItem'
import TaakDatumKiezer from '@/features/taken/TaakDatumKiezer'
import TerugkerendeTakenBeheer from '@/features/taken/TerugkerendeTakenBeheer'
import { getMemberships } from '@/lib/auth/authorization'
import { getActiveStableId, ALLE_STALLEN } from '@/lib/active-stable'

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
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const activeStableId = await getActiveStableId(user.id)
  const alleStallen = activeStableId === ALLE_STALLEN

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

  // Modus: alle stallen van de gebruiker
  if (alleStallen) {
    const memberships = await getMemberships(user.id)
    const stableIds = memberships.map((m) => m.stableId)

    // Zorg dat terugkerende taken voor alle stallen bestaan
    await Promise.all(stableIds.map((id) => ensureRecurringTasksForDate(id, date)))

    const tasksPerStal = await Promise.all(
      stableIds.map((id) => getTasksForDate(id, date))
    )

    // Voeg stalnaam toe aan elke taak voor context
    const stableNames = Object.fromEntries(
      memberships.map((m) => [m.stableId, m.stable.name])
    )

    type TaskWithStalNaam = (typeof tasksPerStal)[0][0] & { stalNaam: string }
    const allTasks: TaskWithStalNaam[] = tasksPerStal.flatMap((tasks, i) =>
      tasks.map((t) => ({ ...t, stalNaam: stableNames[stableIds[i]] ?? '' }))
    )

    const open = allTasks.filter((t) => !t.isCompleted)
    const done = allTasks.filter((t) => t.isCompleted)

    const totaalTaken = allTasks.length
    const gedaanTaken = done.length
    const voortgangPct = totaalTaken > 0
      ? Math.round((gedaanTaken / totaalTaken) * 100)
      : null

    return (
      <main className="page-container">
        <div className="page-header">
          <div>
            <div className="label">Alle stallen</div>
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
            <TaakDatumKiezer value={toDateParam(date)} />
          </div>
          <Link href={`/stal/taken?datum=${toDateParam(next)}`} className="btn-ghost btn-ghost--sm">
            {next.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} →
          </Link>
        </div>

        {voortgangPct !== null && (
          <div className="taken-voortgang">
            <div className="taken-voortgang__balk">
              <div
                className={`taken-voortgang__vulling${voortgangPct === 100 ? ' taken-voortgang__vulling--compleet' : ''}`}
                style={{ width: `${voortgangPct}%` }}
              />
            </div>
            <span className="taken-voortgang__label">
              {gedaanTaken}/{totaalTaken} gedaan
              {voortgangPct === 100
                ? ' — alles afgerond'
                : ` — ${voortgangPct}%`}
            </span>
          </div>
        )}

        {allTasks.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__title">Geen taken</div>
            <p>Er zijn geen taken voor alle stallen op deze dag.</p>
          </div>
        )}

        {open.length > 0 && (
          <div className="taken-sectie">
            <div className="taken-sectie__header">
              <span className="gezondheid-sectie__titel">Openstaand — {open.length}</span>
            </div>
            <div className="taken-lijst">
              {open.map((task) => (
                <div key={task.id}>
                  <TaakItem task={task} horses={[]} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--velaro-color-muted)', paddingLeft: 'var(--velaro-space-3)', paddingBottom: 'var(--velaro-space-2)' }}>
                    {task.stalNaam}
                  </div>
                </div>
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
                <div key={task.id}>
                  <TaakItem task={task} horses={[]} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--velaro-color-muted)', paddingLeft: 'var(--velaro-space-3)', paddingBottom: 'var(--velaro-space-2)' }}>
                    {task.stalNaam}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    )
  }

  // Modus: specifieke actieve stal
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

  // Zorg dat terugkerende taken voor deze dag als Task-rijen bestaan
  await ensureRecurringTasksForDate(stable.id, date)

  const [tasks, horses, recurringTasks] = await Promise.all([
    getTasksForDate(stable.id, date),
    getHorsesForStable(stable.id),
    getRecurringTasksForStable(stable.id),
  ])

  const openTasks = tasks.filter((t) => !t.isCompleted)
  const doneTasks = tasks.filter((t) => t.isCompleted)

  const totaalTaken = tasks.length
  const gedaanTaken = doneTasks.length
  const voortgangPct = totaalTaken > 0
    ? Math.round((gedaanTaken / totaalTaken) * 100)
    : null

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
          <TaakDatumKiezer value={toDateParam(date)} />
        </div>
        <Link href={`/stal/taken?datum=${toDateParam(next)}`} className="btn-ghost btn-ghost--sm">
          {next.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} →
        </Link>
      </div>

      {voortgangPct !== null && (
        <div className="taken-voortgang">
          <div className="taken-voortgang__balk">
            <div
              className={`taken-voortgang__vulling${voortgangPct === 100 ? ' taken-voortgang__vulling--compleet' : ''}`}
              style={{ width: `${voortgangPct}%` }}
            />
          </div>
          <span className="taken-voortgang__label">
            {gedaanTaken}/{totaalTaken} gedaan
            {voortgangPct === 100
              ? ' — alles afgerond'
              : ` — ${voortgangPct}%`}
          </span>
        </div>
      )}

      <div style={{ marginBottom: 'var(--velaro-space-6)' }}>
        <TaakForm
          date={toDateParam(date)}
          horses={horses.map((h) => ({ id: h.id, name: h.name }))}
        />
      </div>

      {openTasks.length === 0 && doneTasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__title">Geen taken</div>
          <p>Voeg hierboven een taak toe voor deze dag.</p>
        </div>
      )}

      {openTasks.length > 0 && (
        <div className="taken-sectie">
          <div className="taken-sectie__header">
            <span className="gezondheid-sectie__titel">Openstaand — {openTasks.length}</span>
          </div>
          <div className="taken-lijst">
            {openTasks.map((task) => (
              <TaakItem key={task.id} task={task} horses={horses.map((h) => ({ id: h.id, name: h.name }))} />
            ))}
          </div>
        </div>
      )}

      {doneTasks.length > 0 && (
        <div className="taken-sectie" style={{ marginTop: 'var(--velaro-space-5)' }}>
          <div className="taken-sectie__header">
            <span className="gezondheid-sectie__titel">Gedaan — {doneTasks.length}</span>
          </div>
          <div className="taken-lijst">
            {doneTasks.map((task) => (
              <TaakItem key={task.id} task={task} horses={horses.map((h) => ({ id: h.id, name: h.name }))} />
            ))}
          </div>
        </div>
      )}

      <TerugkerendeTakenBeheer
        recurringTasks={recurringTasks}
        horses={horses.map((h) => ({ id: h.id, name: h.name }))}
      />
    </main>
  )
}

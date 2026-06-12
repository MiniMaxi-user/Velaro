import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getHorsesForOwner } from '@/features/paarden/queries'
import { getNotesForHorse, getUnreadCountForOwner } from '@/features/mededelingen/queries'
import { getZorgActiesVoorPaard } from '@/features/gezondheid/queries'
import { berekenLeeftijd, formatDatum } from '@/features/paarden/paardHelpers'

export default async function EigenaarPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const horses = await getHorsesForOwner(user.id)

  // Laad de laatste 2 mededelingen, ongelezen-tellers en zorgacties per paard parallel
  const [notesPerPaard, ongelezen, zorgActiesPerPaard] = await Promise.all([
    Promise.all(horses.map((h) => getNotesForHorse(h.id, 2))),
    Promise.all(horses.map((h) => getUnreadCountForOwner(user.id, h.id))),
    Promise.all(horses.map((h) => getZorgActiesVoorPaard(h.id, 60))),
  ])

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span className="breadcrumb-current">Dashboard</span>
          </div>
          <h1 className="page-title">Mijn paarden</h1>
        </div>
      </div>

      {horses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">Geen paarden gevonden</div>
          <p style={{ color: 'var(--velaro-color-muted)', marginTop: 8 }}>
            Je hebt nog geen paarden in je account. Neem contact op met je pensionstal.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {horses.map((horse, index) => {
            const leeftijd = horse.dateOfBirth ? berekenLeeftijd(new Date(horse.dateOfBirth)) : null
            const notes = notesPerPaard[index]
            const zorgActies = zorgActiesPerPaard[index]
            const verlopenActies = zorgActies.filter((a) => a.isVerlopen)

            return (
              <div key={horse.id} className="panel">
                <div className="panel-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="panel-title">{horse.name}</span>
                      {ongelezen[index].ongelezen > 0 && (
                        <span className="badge badge-warning">
                          {ongelezen[index].ongelezen} nieuw
                        </span>
                      )}
                      {verlopenActies.length > 0 && (
                        <span className="badge badge-warning">
                          {verlopenActies.length} zorg verlopen
                        </span>
                      )}
                    </div>
                    <div className="detail-meta" style={{ marginTop: 6 }}>
                      {horse.breed && <span className="badge badge-navy">{horse.breed}</span>}
                      {leeftijd !== null && <span className="badge badge-neutral">{leeftijd} jaar</span>}
                      {horse.discipline && <span className="badge badge-gold">{horse.discipline}</span>}
                    </div>
                  </div>
                  <Link href={`/paarden/${horse.id}`} className="btn-ghost btn-ghost--sm">
                    Bekijk profiel
                  </Link>
                </div>
                <div className="panel-body">
                  <div className="label" style={{ marginBottom: 8 }}>Laatste mededelingen</div>
                  {notes.length === 0 ? (
                    <p style={{ color: 'var(--velaro-color-muted)', fontSize: '0.875rem' }}>
                      Nog geen mededelingen voor dit paard.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {notes.map((note) => (
                        <div key={note.id} className="note-item">
                          <div className="note-item__header">
                            <span className="note-item__author">
                              {note.author.name ?? note.author.email}
                            </span>
                            <span className="note-item__date">
                              {formatDatum(new Date(note.createdAt))}
                            </span>
                          </div>
                          <div className="note-item__message">{note.message}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {zorgActies.length > 0 && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid var(--velaro-color-border)',
                      }}
                    >
                      <div className="label" style={{ marginBottom: 8 }}>Zorgstatus</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {zorgActies.map((actie) => (
                          <div
                            key={actie.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 12px',
                              background: 'var(--velaro-color-surf-2)',
                              borderRadius: 'var(--velaro-radius-md)',
                              fontSize: 'var(--velaro-text-sm)',
                            }}
                          >
                            {actie.isVerlopen ? (
                              <span className="badge badge-warning" style={{ flexShrink: 0 }}>Verlopen</span>
                            ) : (
                              <span className="badge badge-neutral" style={{ flexShrink: 0 }}>
                                {formatDatum(actie.nextDate)}
                              </span>
                            )}
                            <span style={{ flex: 1, minWidth: 0 }}>
                              {actie.type === 'vaccinatie' ? 'Vaccinatie' : actie.type === 'ontworming' ? 'Ontworming' : 'Hoefsmit'}
                              {actie.omschrijving ? ` — ${actie.omschrijving}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

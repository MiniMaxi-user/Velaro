'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Vaccination, Deworming, VetVisit, HoefsmitBezoek } from '@prisma/client'
import DeleteGezondheidButton from './DeleteGezondheidButton'
import { formatDatum } from '@/features/paarden/paardHelpers'

type DatumStatus = 'verlopen' | 'spoedig' | 'ok'

function getDatumStatus(nextDate: Date | null): DatumStatus | null {
  if (!nextDate) return null
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const grens = new Date(vandaag)
  grens.setDate(grens.getDate() + 30)
  if (nextDate < vandaag) return 'verlopen'
  if (nextDate <= grens) return 'spoedig'
  return 'ok'
}

function DatumBadge({ date }: { date: Date | null }) {
  if (!date) return <span className="gezondheid-tabel__muted">—</span>
  const status = getDatumStatus(date)
  return (
    <span className={`gezondheid-datum gezondheid-datum--${status}`}>
      {formatDatum(date)}
    </span>
  )
}

interface Props {
  horseId: string
  vaccinaties: Vaccination[]
  ontwormingen: Deworming[]
  bezzoeken: VetVisit[]
  hoefsmitBezoeKen: HoefsmitBezoek[]
  canEdit: boolean
}

type TabId = 'vaccinaties' | 'ontworming' | 'dierenarts' | 'hoefsmit'

export default function GezondheidTabs({
  horseId,
  vaccinaties,
  ontwormingen,
  bezzoeken,
  hoefsmitBezoeKen,
  canEdit,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('vaccinaties')

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'vaccinaties', label: 'Vaccinaties', count: vaccinaties.length },
    { id: 'ontworming',  label: 'Ontworming',  count: ontwormingen.length },
    { id: 'dierenarts',  label: 'Dierenarts',  count: bezzoeken.length },
    { id: 'hoefsmit',   label: 'Hoefsmit',    count: hoefsmitBezoeKen.length },
  ]

  return (
    <div className="panel">
      {/* Tab-header */}
      <div className="panel-header" style={{ flexDirection: 'column', gap: 0, padding: 0 }}>
        <div className="tabs-inner" style={{ padding: '0 20px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-btn-inner${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="gezondheid-tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Toevoegen-knop per tab */}
        {canEdit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 20px 0' }}>
            {activeTab === 'vaccinaties' && (
              <Link href={`/paarden/${horseId}/vaccinaties/nieuw`} className="btn-ghost btn-ghost--sm">
                + Toevoegen
              </Link>
            )}
            {activeTab === 'ontworming' && (
              <Link href={`/paarden/${horseId}/ontworming/nieuw`} className="btn-ghost btn-ghost--sm">
                + Toevoegen
              </Link>
            )}
            {activeTab === 'dierenarts' && (
              <Link href={`/paarden/${horseId}/dierenarts/nieuw`} className="btn-ghost btn-ghost--sm">
                + Toevoegen
              </Link>
            )}
            {activeTab === 'hoefsmit' && (
              <Link href={`/paarden/${horseId}/hoefsmit/nieuw`} className="btn-ghost btn-ghost--sm">
                + Toevoegen
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Tab-inhoud: Vaccinaties */}
      {activeTab === 'vaccinaties' && (
        vaccinaties.length === 0 ? (
          <div className="gezondheid-leeg">Nog geen vaccinaties geregistreerd.</div>
        ) : (
          <table className="gezondheid-tabel">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Type vaccin</th>
                <th>Volgende datum</th>
                <th>Notities</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {vaccinaties.map((v) => (
                <tr key={v.id}>
                  <td>{formatDatum(new Date(v.date))}</td>
                  <td>{v.type}</td>
                  <td>
                    <DatumBadge date={v.nextDate ? new Date(v.nextDate) : null} />
                  </td>
                  <td className="gezondheid-tabel__muted">{v.notes ?? '—'}</td>
                  {canEdit && (
                    <td className="gezondheid-tabel__acties">
                      <Link href={`/paarden/${horseId}/vaccinaties/${v.id}/bewerken`} className="btn-ghost btn-ghost--sm">Bewerken</Link>
                      <DeleteGezondheidButton id={v.id} horseId={horseId} type="vaccinatie" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {/* Tab-inhoud: Ontworming */}
      {activeTab === 'ontworming' && (
        ontwormingen.length === 0 ? (
          <div className="gezondheid-leeg">Nog geen ontworming geregistreerd.</div>
        ) : (
          <table className="gezondheid-tabel">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Product</th>
                <th>Volgende datum</th>
                <th>Notities</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {ontwormingen.map((o) => (
                <tr key={o.id}>
                  <td>{formatDatum(new Date(o.date))}</td>
                  <td>{o.product}</td>
                  <td>
                    <DatumBadge date={o.nextDate ? new Date(o.nextDate) : null} />
                  </td>
                  <td className="gezondheid-tabel__muted">{o.notes ?? '—'}</td>
                  {canEdit && (
                    <td className="gezondheid-tabel__acties">
                      <Link href={`/paarden/${horseId}/ontworming/${o.id}/bewerken`} className="btn-ghost btn-ghost--sm">Bewerken</Link>
                      <DeleteGezondheidButton id={o.id} horseId={horseId} type="ontworming" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {/* Tab-inhoud: Dierenartsenbezoeken */}
      {activeTab === 'dierenarts' && (
        bezzoeken.length === 0 ? (
          <div className="gezondheid-leeg">Nog geen dierenartsenbezoeken geregistreerd.</div>
        ) : (
          <table className="gezondheid-tabel">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Dierenarts</th>
                <th>Reden</th>
                <th>Notities</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {bezzoeken.map((b) => (
                <tr key={b.id}>
                  <td>{formatDatum(new Date(b.date))}</td>
                  <td className="gezondheid-tabel__muted">{b.vet ?? '—'}</td>
                  <td>{b.reason}</td>
                  <td className="gezondheid-tabel__muted">{b.notes ?? '—'}</td>
                  {canEdit && (
                    <td className="gezondheid-tabel__acties">
                      <Link href={`/paarden/${horseId}/dierenarts/${b.id}/bewerken`} className="btn-ghost btn-ghost--sm">Bewerken</Link>
                      <DeleteGezondheidButton id={b.id} horseId={horseId} type="dierenarts" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {/* Tab-inhoud: Hoefsmitbezoeken */}
      {activeTab === 'hoefsmit' && (
        hoefsmitBezoeKen.length === 0 ? (
          <div className="gezondheid-leeg">Nog geen hoefsmitbezoeken geregistreerd.</div>
        ) : (
          <table className="gezondheid-tabel">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Hoefsmid</th>
                <th>Volgende datum</th>
                <th>Notities</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {hoefsmitBezoeKen.map((h) => (
                <tr key={h.id}>
                  <td>{formatDatum(new Date(h.date))}</td>
                  <td className="gezondheid-tabel__muted">{h.hoefsmid ?? '—'}</td>
                  <td>
                    <DatumBadge date={h.nextDate ? new Date(h.nextDate) : null} />
                  </td>
                  <td className="gezondheid-tabel__muted">{h.notes ?? '—'}</td>
                  {canEdit && (
                    <td className="gezondheid-tabel__acties">
                      <Link href={`/paarden/${horseId}/hoefsmit/${h.id}/bewerken`} className="btn-ghost btn-ghost--sm">Bewerken</Link>
                      <DeleteGezondheidButton id={h.id} horseId={horseId} type="hoefsmit" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
}

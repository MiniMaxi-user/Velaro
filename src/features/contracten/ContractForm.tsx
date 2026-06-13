'use client'

import { useRef } from 'react'
import Link from 'next/link'
import SubmitButton from '@/components/SubmitButton'
import { BOXTYPE_OPTIES, BOXTYPE_LABELS, type HuisvestingConfig } from './huisvesting'
import {
  FACILITEIT_OPTIES,
  FACILITEIT_LABELS,
  WEIDEGANG_VORM_OPTIES,
  WEIDEGANG_VORM_LABELS,
  type DienstpakketConfig,
} from './dienstpakket'

type OwnerOption = { userId: string; label: string }

// Voorvulwaarden uit het FeedingPlan van het paard (STAL-04). Wanneer er geen
// voederschema is, is dit object null en wordt de overnemen-knop uitgeschakeld.
type VoerVoorvulling = {
  ruwvoer: string | null
  krachtvoer: string | null
}

export default function ContractForm({
  horseId,
  action,
  owners,
  defaultCounterpartyUserId,
  defaultStartDate,
  huisvesting,
  dienstpakket,
  voederschema,
  submitLabel = 'Concept aanmaken',
}: {
  horseId: string
  action: (formData: FormData) => Promise<void>
  owners: OwnerOption[]
  defaultCounterpartyUserId?: string
  defaultStartDate?: string
  // Wanneer meegegeven, toont het formulier de sectie "Huisvesting & verzorging".
  // Op het bewerkscherm vullen we boxNumber voor uit het paardprofiel (overschrijfbaar).
  huisvesting?: HuisvestingConfig
  // Wanneer meegegeven, toont het formulier de blokken voer/weidegang/faciliteiten.
  dienstpakket?: DienstpakketConfig
  // Voorvulwaarden uit het FeedingPlan; null wanneer het paard geen voederschema heeft.
  voederschema?: VoerVoorvulling | null
  submitLabel?: string
}) {
  const ruwvoerRef = useRef<HTMLInputElement>(null)
  const krachtvoerRef = useRef<HTMLInputElement>(null)

  // Vult de voervelden vanuit het voederschema (roughage -> ruwvoer, concentrate ->
  // krachtvoer). De velden blijven daarna bewerkbaar. Zonder voederschema is de knop
  // uitgeschakeld, dus deze handler wordt dan niet aangeroepen.
  const overnemenUitVoederschema = () => {
    if (!voederschema) return
    if (ruwvoerRef.current) ruwvoerRef.current.value = voederschema.ruwvoer ?? ''
    if (krachtvoerRef.current) krachtvoerRef.current.value = voederschema.krachtvoer ?? ''
  }

  return (
    <form action={action} className="form-card">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="type" className="form-label">Type contract</label>
          <input
            id="type"
            type="text"
            className="input"
            value="Stalling — Full pension"
            readOnly
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="counterpartyUserId" className="form-label">Wederpartij (eigenaar) *</label>
          <select
            id="counterpartyUserId"
            name="counterpartyUserId"
            className="input"
            required
            defaultValue={
              defaultCounterpartyUserId ??
              (owners.length === 1 ? owners[0].userId : '')
            }
          >
            <option value="" disabled>
              Kies een eigenaar
            </option>
            {owners.map((o) => (
              <option key={o.userId} value={o.userId}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startDate" className="form-label">Ingangsdatum</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className="input"
            defaultValue={defaultStartDate}
          />
        </div>
      </div>

      {huisvesting && (
        <div className="form-section" style={{ marginTop: 'var(--velaro-space-6)' }}>
          <div className="form-section-title">Huisvesting &amp; verzorging</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="boxtype" className="form-label">Boxtype</label>
              <select
                id="boxtype"
                name="boxtype"
                className="input"
                defaultValue={huisvesting.boxtype ?? ''}
              >
                <option value="">Niet opgegeven</option>
                {BOXTYPE_OPTIES.map((opt) => (
                  <option key={opt} value={opt}>
                    {BOXTYPE_LABELS[opt]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="boxNumber" className="form-label">Stalplek / boxnummer</label>
              <input
                id="boxNumber"
                name="boxNumber"
                type="text"
                className="input"
                defaultValue={huisvesting.boxNumber ?? ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="beddingtype" className="form-label">Beddingtype</label>
              <input
                id="beddingtype"
                name="beddingtype"
                type="text"
                className="input"
                placeholder="bijv. stro, vlas, zaagsel"
                defaultValue={huisvesting.beddingtype ?? ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="toezicht" className="form-label">Toezicht / verzorging</label>
              <input
                id="toezicht"
                name="toezicht"
                type="text"
                className="input"
                placeholder="bijv. dagelijkse controle"
                defaultValue={huisvesting.toezicht ?? ''}
              />
            </div>

            <div className="form-group">
              <label className="profiel-checkbox-label">
                <input
                  className="profiel-checkbox"
                  type="checkbox"
                  name="uitmesten"
                  value="true"
                  defaultChecked={huisvesting.uitmesten}
                />
                <span>Uitmesten door de stal</span>
              </label>
            </div>

            <div className="form-group">
              <label className="profiel-checkbox-label">
                <input
                  className="profiel-checkbox"
                  type="checkbox"
                  name="opstrooien"
                  value="true"
                  defaultChecked={huisvesting.opstrooien}
                />
                <span>Opstrooien door de stal</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {dienstpakket && (
        <>
          <div className="form-section" style={{ marginTop: 'var(--velaro-space-6)' }}>
            <div className="form-section-title">Voer &amp; verzorging</div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="voerRuwvoer" className="form-label">Ruwvoer</label>
                <input
                  id="voerRuwvoer"
                  name="voerRuwvoer"
                  type="text"
                  className="input"
                  ref={ruwvoerRef}
                  placeholder="bijv. 3x daags hooi"
                  defaultValue={dienstpakket.voer.ruwvoer ?? ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="voerKrachtvoer" className="form-label">Krachtvoer</label>
                <input
                  id="voerKrachtvoer"
                  name="voerKrachtvoer"
                  type="text"
                  className="input"
                  ref={krachtvoerRef}
                  placeholder="bijv. 2 scheppen muesli ochtend en avond"
                  defaultValue={dienstpakket.voer.krachtvoer ?? ''}
                />
              </div>
            </div>
            <div style={{ marginTop: 'var(--velaro-space-3)' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={overnemenUitVoederschema}
                disabled={!voederschema}
                title={
                  voederschema
                    ? undefined
                    : 'Dit paard heeft nog geen voederschema om over te nemen.'
                }
              >
                Overnemen uit voederschema
              </button>
              {!voederschema && (
                <span
                  className="form-hint"
                  style={{ marginLeft: 'var(--velaro-space-3)' }}
                >
                  Geen voederschema beschikbaar voor dit paard.
                </span>
              )}
            </div>
          </div>

          <div className="form-section" style={{ marginTop: 'var(--velaro-space-6)' }}>
            <div className="form-section-title">Weidegang</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="profiel-checkbox-label">
                  <input
                    className="profiel-checkbox"
                    type="checkbox"
                    name="weidegangActief"
                    value="true"
                    defaultChecked={dienstpakket.weidegang.actief}
                  />
                  <span>Weidegang inbegrepen</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="weidegangVorm" className="form-label">Vorm</label>
                <select
                  id="weidegangVorm"
                  name="weidegangVorm"
                  className="input"
                  defaultValue={dienstpakket.weidegang.vorm ?? ''}
                >
                  <option value="">Niet opgegeven</option>
                  {WEIDEGANG_VORM_OPTIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {WEIDEGANG_VORM_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="weidegangUren" className="form-label">Uren per dag</label>
                <input
                  id="weidegangUren"
                  name="weidegangUren"
                  type="text"
                  className="input"
                  placeholder="bijv. 6 uur"
                  defaultValue={dienstpakket.weidegang.urenPerDag ?? ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="weidegangSeizoen" className="form-label">Seizoen</label>
                <input
                  id="weidegangSeizoen"
                  name="weidegangSeizoen"
                  type="text"
                  className="input"
                  placeholder="bijv. april t/m oktober"
                  defaultValue={dienstpakket.weidegang.seizoen ?? ''}
                />
              </div>
            </div>
          </div>

          <div className="form-section" style={{ marginTop: 'var(--velaro-space-6)' }}>
            <div className="form-section-title">Faciliteiten</div>
            <div className="form-grid">
              {FACILITEIT_OPTIES.map((opt) => (
                <div className="form-group" key={opt}>
                  <label className="profiel-checkbox-label">
                    <input
                      className="profiel-checkbox"
                      type="checkbox"
                      name="faciliteiten"
                      value={opt}
                      defaultChecked={dienstpakket.faciliteiten.geselecteerd.includes(opt)}
                    />
                    <span>{FACILITEIT_LABELS[opt]}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="action-buttons">
        <SubmitButton label={submitLabel} />
        <Link href={`/paarden/${horseId}?tab=contracten`} className="btn-ghost">Annuleren</Link>
      </div>
    </form>
  )
}

'use client'

import { useRef, useState } from 'react'
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
import {
  BTW_MODUS_OPTIES,
  BTW_MODUS_LABELS,
  LOOPTIJD_AARD_OPTIES,
  LOOPTIJD_AARD_LABELS,
  OPZEGTERMIJN_EENHEID_OPTIES,
  OPZEGTERMIJN_EENHEID_LABELS,
  VERLENGING_OPTIES,
  VERLENGING_LABELS,
  INDEXERING_MOMENT_OPTIES,
  INDEXERING_MOMENT_LABELS,
  isOpzegtermijnKorterDanMaand,
  type PrijsLooptijdConfig,
  type LooptijdAard,
  type OpzegtermijnEenheid,
} from './prijsLooptijd'

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
  prijsLooptijd,
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
  // Wanneer meegegeven, toont het formulier de sectie "Prijs & looptijd".
  prijsLooptijd?: PrijsLooptijdConfig
  submitLabel?: string
}) {
  const ruwvoerRef = useRef<HTMLInputElement>(null)
  const krachtvoerRef = useRef<HTMLInputElement>(null)

  // Client-state voor de prijs/looptijd-sectie: aard stuurt de zichtbaarheid van de
  // einddatum; de opzegtermijn-velden tonen een waarschuwing als de termijn korter
  // dan 1 kalendermaand is. Harde validatie gebeurt altijd server-side.
  const [looptijdAard, setLooptijdAard] = useState<LooptijdAard>(
    prijsLooptijd?.looptijd.aard ?? 'ONBEPAALD',
  )
  const [opzegWaarde, setOpzegWaarde] = useState<number>(
    prijsLooptijd?.looptijd.opzegtermijn.waarde ?? 1,
  )
  const [opzegEenheid, setOpzegEenheid] = useState<OpzegtermijnEenheid>(
    prijsLooptijd?.looptijd.opzegtermijn.eenheid ?? 'MAANDEN',
  )
  const opzegtermijnKort = isOpzegtermijnKorterDanMaand({
    waarde: opzegWaarde,
    eenheid: opzegEenheid,
    schriftelijk: true,
  })

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

      {prijsLooptijd && (
        <>
          <div className="form-section" style={{ marginTop: 'var(--velaro-space-6)' }}>
            <div className="form-section-title">Prijs &amp; borg</div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="prijsBedrag" className="form-label">Pensionprijs (€ per maand)</label>
                <input
                  id="prijsBedrag"
                  name="prijsBedrag"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="bijv. 450"
                  defaultValue={prijsLooptijd.prijs.bedrag ?? ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prijsBtwModus" className="form-label">Btw</label>
                <select
                  id="prijsBtwModus"
                  name="prijsBtwModus"
                  className="input"
                  defaultValue={prijsLooptijd.prijs.btwModus}
                >
                  {BTW_MODUS_OPTIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {BTW_MODUS_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="prijsBtwPercentage" className="form-label">Btw-percentage (%)</label>
                <input
                  id="prijsBtwPercentage"
                  name="prijsBtwPercentage"
                  type="number"
                  min="0"
                  step="0.1"
                  className="input"
                  placeholder="bijv. 21"
                  defaultValue={prijsLooptijd.prijs.btwPercentage ?? ''}
                />
              </div>

              <div className="form-group">
                <label className="profiel-checkbox-label">
                  <input
                    className="profiel-checkbox"
                    type="checkbox"
                    name="borgActief"
                    value="true"
                    defaultChecked={prijsLooptijd.borg.actief}
                  />
                  <span>Borg van toepassing</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="borgBedrag" className="form-label">Borgbedrag (€)</label>
                <input
                  id="borgBedrag"
                  name="borgBedrag"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="bijv. 500"
                  defaultValue={prijsLooptijd.borg.bedrag ?? ''}
                />
                <span className="form-hint">Verplicht wanneer borg van toepassing is.</span>
              </div>
            </div>
          </div>

          <div className="form-section" style={{ marginTop: 'var(--velaro-space-6)' }}>
            <div className="form-section-title">Looptijd</div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="looptijdAard" className="form-label">Aard van de looptijd</label>
                <select
                  id="looptijdAard"
                  name="looptijdAard"
                  className="input"
                  value={looptijdAard}
                  onChange={(e) => setLooptijdAard(e.target.value as LooptijdAard)}
                >
                  {LOOPTIJD_AARD_OPTIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {LOOPTIJD_AARD_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>

              {looptijdAard === 'BEPAALD' && (
                <div className="form-group">
                  <label htmlFor="looptijdEinddatum" className="form-label">Einddatum *</label>
                  <input
                    id="looptijdEinddatum"
                    name="looptijdEinddatum"
                    type="date"
                    className="input"
                    defaultValue={prijsLooptijd.looptijd.einddatum ?? ''}
                  />
                  <span className="form-hint">Verplicht bij een contract voor bepaalde tijd.</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="looptijdMinimumperiode" className="form-label">Minimumperiode</label>
                <input
                  id="looptijdMinimumperiode"
                  name="looptijdMinimumperiode"
                  type="text"
                  className="input"
                  placeholder="bijv. 3 maanden"
                  defaultValue={prijsLooptijd.looptijd.minimumperiode ?? ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="opzegtermijnWaarde" className="form-label">Opzegtermijn</label>
                <div className="form-row">
                  <input
                    id="opzegtermijnWaarde"
                    name="opzegtermijnWaarde"
                    type="number"
                    min="0"
                    step="1"
                    className="input"
                    value={opzegWaarde}
                    onChange={(e) => setOpzegWaarde(Number(e.target.value))}
                  />
                  <select
                    name="opzegtermijnEenheid"
                    className="input"
                    value={opzegEenheid}
                    onChange={(e) => setOpzegEenheid(e.target.value as OpzegtermijnEenheid)}
                  >
                    {OPZEGTERMIJN_EENHEID_OPTIES.map((opt) => (
                      <option key={opt} value={opt}>
                        {OPZEGTERMIJN_EENHEID_LABELS[opt]}
                      </option>
                    ))}
                  </select>
                </div>
                {opzegtermijnKort && (
                  <span className="form-error">
                    Waarschuwing: de opzegtermijn is korter dan 1 kalendermaand.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="profiel-checkbox-label">
                  <input
                    className="profiel-checkbox"
                    type="checkbox"
                    name="opzegtermijnSchriftelijk"
                    value="true"
                    defaultChecked={prijsLooptijd.looptijd.opzegtermijn.schriftelijk}
                  />
                  <span>Opzeggen dient schriftelijk te gebeuren</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="looptijdVerlenging" className="form-label">Verlenging</label>
                <select
                  id="looptijdVerlenging"
                  name="looptijdVerlenging"
                  className="input"
                  defaultValue={prijsLooptijd.looptijd.verlenging}
                >
                  {VERLENGING_OPTIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {VERLENGING_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="profiel-checkbox-label">
                  <input
                    className="profiel-checkbox"
                    type="checkbox"
                    name="proefperiodeActief"
                    value="true"
                    defaultChecked={prijsLooptijd.looptijd.proefperiode.actief}
                  />
                  <span>Proefperiode</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="proefperiodeDuur" className="form-label">Duur proefperiode</label>
                <input
                  id="proefperiodeDuur"
                  name="proefperiodeDuur"
                  type="text"
                  className="input"
                  placeholder="bijv. 1 maand"
                  defaultValue={prijsLooptijd.looptijd.proefperiode.duur ?? ''}
                />
              </div>

              <div className="form-group">
                <label className="profiel-checkbox-label">
                  <input
                    className="profiel-checkbox"
                    type="checkbox"
                    name="indexeringActief"
                    value="true"
                    defaultChecked={prijsLooptijd.looptijd.indexering.actief}
                  />
                  <span>Indexering van toepassing</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="indexeringGrondslag" className="form-label">Grondslag indexering</label>
                <input
                  id="indexeringGrondslag"
                  name="indexeringGrondslag"
                  type="text"
                  className="input"
                  placeholder="bijv. CBS-prijsindex"
                  defaultValue={prijsLooptijd.looptijd.indexering.grondslag ?? ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="indexeringMoment" className="form-label">Moment indexering</label>
                <select
                  id="indexeringMoment"
                  name="indexeringMoment"
                  className="input"
                  defaultValue={prijsLooptijd.looptijd.indexering.moment ?? ''}
                >
                  <option value="">Niet opgegeven</option>
                  {INDEXERING_MOMENT_OPTIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {INDEXERING_MOMENT_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>
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

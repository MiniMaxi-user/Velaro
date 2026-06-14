import { Fragment } from 'react'
import { formatDatum } from '@/features/paarden/paardHelpers'
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_BADGE,
  contractTypeLabel,
} from './contractHelpers'
import {
  NALEVING_STATUS_LABELS,
  NALEVING_STATUS_BADGE,
} from './gezondheidsplicht'
import { heeftBerijder, leesBerijder } from './berijder'
import { isMinderjarig } from '@/features/paarden/paardHelpers'
import type { NalevingRegel } from './queries'
import NieuwContractKnop from './NieuwContractKnop'
import ContractActies from './ContractActies'
import { ontbrekendeAanbiedVelden } from './aanbiedValidatie'
import type { ContractStatus, Prisma } from '@prisma/client'

type ContractRow = {
  id: string
  type: string
  status: ContractStatus
  startDate: Date | null
  createdAt: Date
  config: Prisma.JsonValue | null
  counterpartyUserId: string | null
  counterparty: { id: string; name: string | null; email: string } | null
}

export default function ContractenPanel({
  horseId,
  contracts,
  hasOwners,
  naleving = {},
}: {
  horseId: string
  contracts: ContractRow[]
  hasOwners: boolean
  // Per contract-id de nalevingsregels (STAL-07). Lege/ontbrekende lijst = geen
  // actieve gezondheidsplicht om te tonen.
  naleving?: Record<string, NalevingRegel[]>
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Contracten</span>
        <NieuwContractKnop horseId={horseId} hasOwners={hasOwners} />
      </div>
      <div className="panel-body">
        {contracts.length === 0 ? (
          <div className="gezondheid-leeg">Nog geen contracten voor dit paard.</div>
        ) : (
          <table className="gezondheid-tabel">
            <thead>
              <tr>
                <th>Type</th>
                <th>Wederpartij</th>
                <th>Ingangsdatum</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const regels = naleving[c.id] ?? []
                // Berijder (STAL-10): optioneel optieblok. Alleen tonen wanneer een
                // naam is vastgelegd; bij een geboortedatum een minderjarig-indicatie.
                const berijder = leesBerijder(c.config)
                const berijderGeboortedatum = berijder.geboortedatum
                  ? new Date(berijder.geboortedatum)
                  : null
                const berijderMinderjarig =
                  isMinderjarig(berijderGeboortedatum) === true
                return (
                  <Fragment key={c.id}>
                    <tr>
                      <td>{contractTypeLabel(c.type)}</td>
                      <td className="gezondheid-tabel__muted">
                        {c.counterparty
                          ? c.counterparty.name ?? c.counterparty.email
                          : '—'}
                      </td>
                      <td className="gezondheid-tabel__muted">
                        {c.startDate ? formatDatum(new Date(c.startDate)) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${CONTRACT_STATUS_BADGE[c.status]}`}>
                          {CONTRACT_STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td>
                        {c.status === 'CONCEPT' && (
                          <ContractActies
                            horseId={horseId}
                            contractId={c.id}
                            heeftWederpartij={Boolean(c.counterpartyUserId)}
                            ontbrekendeVelden={ontbrekendeAanbiedVelden(c.config)}
                          />
                        )}
                      </td>
                    </tr>
                    {regels.length > 0 && (
                      <tr>
                        <td colSpan={5} style={{ paddingTop: 0 }}>
                          <div className="contract-naleving">
                            <div className="contract-naleving__titel">
                              Entings- &amp; gezondheidsplicht
                            </div>
                            <ul className="contract-naleving__lijst">
                              {regels.map((r, i) => (
                                <li key={i} className="contract-naleving__regel">
                                  <span className="contract-naleving__onderdeel">
                                    {r.onderdeel}
                                  </span>
                                  <span className={`badge ${NALEVING_STATUS_BADGE[r.status]}`}>
                                    {NALEVING_STATUS_LABELS[r.status]}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                    {heeftBerijder(berijder) && (
                      <tr>
                        <td colSpan={5} style={{ paddingTop: 0 }}>
                          <div className="contract-naleving">
                            <div className="contract-naleving__titel">Berijder</div>
                            <ul className="contract-naleving__lijst">
                              <li className="contract-naleving__regel">
                                <span className="contract-naleving__onderdeel">
                                  {berijder.naam}
                                  {berijder.relatieTotEigenaar
                                    ? ` (${berijder.relatieTotEigenaar})`
                                    : ''}
                                </span>
                                {berijderMinderjarig && (
                                  <span className="badge badge-warning">Minderjarig</span>
                                )}
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { formatDatum } from '@/features/paarden/paardHelpers'
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_BADGE,
  contractTypeLabel,
  huidigeVersies,
  afleidEinddatum,
  eerstvolgendeActieStal,
  eerstvolgendeActieEigenaar,
  type OverzichtContract,
} from './contractHelpers'

// Overzichtsregel voor het contract-dashboard per partij (STAL-13, #86). Bevat de
// velden voor de groepering (OverzichtContract) plus het paard en — in de stal-
// weergave — de wederpartij. In de eigenaar-weergave is de wederpartij de eigenaar
// zelf en wordt die kolom weggelaten.
export type ContractOverzichtRegel = OverzichtContract & {
  type: string
  horse: { id: string; name: string }
  counterparty?: { id: string; name: string | null; email: string } | null
}

// Toont één contracten-overzicht voor één partij. `rol` bepaalt welke openstaande
// actie wordt gesignaleerd en of de wederpartij-kolom getoond wordt. Er worden
// uitsluitend huidige versies getoond (vervangen versies vallen weg) en alle
// statuslabels/badges hergebruiken de bestaande CONTRACT_STATUS_*-tabellen.
export default function ContractOverzicht({
  contracts,
  rol,
  legeTekst = 'Er zijn nog geen contracten.',
}: {
  contracts: ContractOverzichtRegel[]
  rol: 'STAL' | 'EIGENAAR'
  legeTekst?: string
}) {
  const regels = huidigeVersies(contracts)
  const toonWederpartij = rol === 'STAL'

  if (regels.length === 0) {
    return <div className="gezondheid-leeg">{legeTekst}</div>
  }

  return (
    <table className="gezondheid-tabel">
      <thead>
        <tr>
          <th>Paard</th>
          {toonWederpartij && <th>Wederpartij</th>}
          <th>Type</th>
          <th>Ingangsdatum</th>
          <th>Einddatum</th>
          <th>Status</th>
          <th>Actie</th>
        </tr>
      </thead>
      <tbody>
        {regels.map((c) => {
          const einddatum = afleidEinddatum(c.config)
          const actie =
            rol === 'STAL'
              ? eerstvolgendeActieStal(c)
              : eerstvolgendeActieEigenaar(c)
          return (
            <tr key={c.id}>
              <td>
                <Link href={`/paarden/${c.horse.id}`} className="form-link">
                  {c.horse.name}
                </Link>
              </td>
              {toonWederpartij && (
                <td className="gezondheid-tabel__muted">
                  {c.counterparty
                    ? c.counterparty.name ?? c.counterparty.email
                    : '—'}
                </td>
              )}
              <td className="gezondheid-tabel__muted">{contractTypeLabel(c.type)}</td>
              <td className="gezondheid-tabel__muted">
                {c.startDate ? formatDatum(new Date(c.startDate)) : '—'}
              </td>
              <td className="gezondheid-tabel__muted">
                {einddatum ? formatDatum(einddatum) : '—'}
              </td>
              <td>
                <span className={`badge ${CONTRACT_STATUS_BADGE[c.status]}`}>
                  {CONTRACT_STATUS_LABELS[c.status]}
                </span>
              </td>
              <td>
                {actie ? (
                  <span className={`badge ${actie.badge}`}>{actie.label}</span>
                ) : (
                  <span className="gezondheid-tabel__muted">—</span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

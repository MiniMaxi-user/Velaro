import type { ContractStatus, ContractFamily, Prisma } from '@prisma/client'
import { leesPrijsLooptijd } from './prijsLooptijd'
import { leesVersieGroepId } from './statusMachine'

// Nederlandse labels voor de contractstatussen. Alleen CONCEPT wordt in STAL-01
// aangemaakt; de overige statussen horen bij latere stories maar zijn hier al
// gelabeld zodat de lijst-weergave volledig is.
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  CONCEPT: 'Concept',
  AANGEBODEN: 'Aangeboden',
  GEACCEPTEERD: 'Geaccepteerd',
  ACTIEF: 'Actief',
  OPGESCHORT: 'Opgeschort',
  OPZEGGING_LOOPT: 'Opzegging loopt',
  VERLENGD: 'Verlengd',
  BEEINDIGD: 'Beëindigd',
  VERLOPEN: 'Verlopen',
  GEANNULEERD: 'Geannuleerd',
  AFGEWEZEN: 'Afgewezen',
  VERVANGEN: 'Vervangen',
}

// Badge-variant per status. Sluit aan op de bestaande .badge-* klassen.
export const CONTRACT_STATUS_BADGE: Record<ContractStatus, string> = {
  CONCEPT: 'badge-neutral',
  AANGEBODEN: 'badge-gold',
  GEACCEPTEERD: 'badge-gold',
  ACTIEF: 'badge-success',
  OPGESCHORT: 'badge-warning',
  OPZEGGING_LOOPT: 'badge-warning',
  VERLENGD: 'badge-success',
  BEEINDIGD: 'badge-neutral',
  VERLOPEN: 'badge-neutral',
  GEANNULEERD: 'badge-neutral',
  AFGEWEZEN: 'badge-warning',
  VERVANGEN: 'badge-neutral',
}

export const CONTRACT_FAMILY_LABELS: Record<ContractFamily, string> = {
  STALLING: 'Stalling',
  LEASE: 'Lease',
}

// Type-labels. v1 kent alleen FULL_PENSION binnen de stalling-familie.
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FULL_PENSION: 'Full pension',
}

export function contractTypeLabel(type: string): string {
  return CONTRACT_TYPE_LABELS[type] ?? type
}

// ── Overzicht per partij (STAL-13, #86) ──────────────────────────────────────
// Alleen-lezen afgeleide logica voor het contract-dashboard: huidige-versie-
// groepering, einddatum afleiden uit de looptijd (STAL-05) en de eerstvolgende
// openstaande actie per rol. Geen nieuwe statussen of schemawijzigingen — er wordt
// uitsluitend gesignaleerd op situaties die nu al bestaan (CONCEPT/AANGEBODEN +
// optioneel "verloopt binnenkort"). De rijkere acties komen met STAL-14/15.

// Minimale vorm die nodig is om een contract in het overzicht te groeperen/tonen.
export type OverzichtContract = {
  id: string
  status: ContractStatus
  startDate: Date | null
  createdAt: Date
  currentVersion: number
  config: Prisma.JsonValue | null
}

// Houdt per contractgroep (zie STAL-11) uitsluitend de huidige versie over: de
// versie met de hoogste currentVersion. Vervangen versies vallen weg. Sorteert op
// de aanmaakdatum van de huidige versie, nieuwste eerst (sluit aan op de
// query-volgorde). Generiek over T zodat de relaties (horse, counterparty) op het
// element behouden blijven.
export function huidigeVersies<T extends OverzichtContract>(contracts: T[]): T[] {
  const groepen = new Map<string, T[]>()
  for (const c of contracts) {
    const groepId = leesVersieGroepId(c.config) ?? c.id
    const bestaand = groepen.get(groepId)
    if (bestaand) bestaand.push(c)
    else groepen.set(groepId, [c])
  }
  const huidig = Array.from(groepen.values()).map((versies) =>
    [...versies].sort((a, b) => b.currentVersion - a.currentVersion)[0],
  )
  huidig.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return huidig
}

// Leidt de einddatum van een contract af. Bij bepaalde tijd staat de einddatum
// expliciet in de looptijd-config (STAL-05). Bij onbepaalde tijd of een ontbrekende
// datum is er geen einddatum: dan null (de weergave toont "—"). Er wordt bewust geen
// nieuwe looptijd-logica bedacht.
export function afleidEinddatum(config: Prisma.JsonValue | null): Date | null {
  const { looptijd } = leesPrijsLooptijd(config)
  if (looptijd.aard !== 'BEPAALD' || !looptijd.einddatum) return null
  const datum = new Date(looptijd.einddatum)
  return Number.isNaN(datum.getTime()) ? null : datum
}

// "Verloopt binnenkort": een afgeleide einddatum die binnen `dagen` (default 30)
// in de toekomst ligt. Een al verstreken einddatum geldt niet als "binnenkort"
// (daar hoort een echte statusovergang bij, die buiten deze story valt).
export function verlooptBinnenkort(
  einddatum: Date | null,
  vandaag: Date = new Date(),
  dagen = 30,
): boolean {
  if (!einddatum) return false
  const verschilMs = einddatum.getTime() - vandaag.getTime()
  if (verschilMs < 0) return false
  return verschilMs <= dagen * 24 * 60 * 60 * 1000
}

// Een gesignaleerde openstaande actie: een label + de bestaande badge-variant.
export type OpenstaandeActie = {
  label: string
  badge: string
}

// Bepaalt de eerstvolgende openstaande actie voor het stal-overzicht (OWNER/STAFF).
// Beperkt tot bestaande situaties: CONCEPT (nog niet aangeboden), AANGEBODEN (wacht
// op de eigenaar) en — als neutrale signalering — een binnenkort verlopende einddatum.
// Geen actie → null.
export function eerstvolgendeActieStal(
  contract: OverzichtContract,
  vandaag: Date = new Date(),
): OpenstaandeActie | null {
  if (contract.status === 'CONCEPT') {
    return { label: 'Nog niet aangeboden', badge: 'badge-neutral' }
  }
  if (contract.status === 'AANGEBODEN') {
    return { label: 'Wacht op eigenaar', badge: 'badge-gold' }
  }
  if (verlooptBinnenkort(afleidEinddatum(contract.config), vandaag)) {
    return { label: 'Verloopt binnenkort', badge: 'badge-warning' }
  }
  return null
}

// Bepaalt de eerstvolgende openstaande actie voor de eigenaar-weergave. De eigenaar
// ziet geen concepten van de stal (die zijn nog niet aangeboden), dus alleen
// AANGEBODEN (te beoordelen) en "verloopt binnenkort" leveren een signaal op.
export function eerstvolgendeActieEigenaar(
  contract: OverzichtContract,
  vandaag: Date = new Date(),
): OpenstaandeActie | null {
  if (contract.status === 'AANGEBODEN') {
    return { label: 'Te beoordelen', badge: 'badge-gold' }
  }
  if (verlooptBinnenkort(afleidEinddatum(contract.config), vandaag)) {
    return { label: 'Verloopt binnenkort', badge: 'badge-warning' }
  }
  return null
}

import type { Prisma } from '@prisma/client'

// ── Entings- & gezondheidsplicht (STAL-07) ───────────────────────────────────
// Zevende optieblok van het stallingscontract (§3.3). Net als bij STAL-03/04/05/06
// worden de afspraken als JSON op het bestaande Contract.config-veld bewaard — hier
// onder de sleutel `gezondheidsplicht`. Er is dus geen schemamigratie nodig en
// bestaande config-sleutels (huisvesting, voer, weidegang, faciliteiten,
// prijsLooptijd, verzekeringAansprakelijkheid) blijven ongewijzigd.
//
// De toegevoegde waarde t.o.v. de eerdere blokken is de koppeling met echte
// paarddata: de contract-weergave zet de afgesproken plicht af tegen de laatst
// geregistreerde Vaccination / Deworming / HoefsmitBezoek (zie statusvergelijking
// onderaan deze module).

// ── Vaccinatieplicht ─────────────────────────────────────────────────────────
// Welke vaccinaties verplicht zijn (checkbox-set) en het interval in maanden.
// De optie-keys sluiten aan op de vrije tekst van Vaccination.type (influenza,
// tetanus) — de vergelijking gebeurt case-insensitive op een trefwoord.

export const VACCINATIE_SOORT_LABELS = {
  INFLUENZA: 'Influenza',
  TETANUS: 'Tetanus',
} as const

export type VaccinatieSoort = keyof typeof VACCINATIE_SOORT_LABELS

export const VACCINATIE_SOORT_OPTIES = Object.keys(
  VACCINATIE_SOORT_LABELS,
) as VaccinatieSoort[]

// Trefwoorden waarop een Vaccination.type aan een verplichte soort wordt gekoppeld.
const VACCINATIE_TREFWOORDEN: Record<VaccinatieSoort, string[]> = {
  INFLUENZA: ['influenza', 'griep', 'flu'],
  TETANUS: ['tetanus'],
}

export type VaccinatieplichtConfig = {
  actief: boolean
  soorten: VaccinatieSoort[]
  intervalMaanden: number | null
}

export const LEGE_VACCINATIEPLICHT: VaccinatieplichtConfig = {
  actief: false,
  soorten: [],
  intervalMaanden: null,
}

// ── Ontworming / mestonderzoek ───────────────────────────────────────────────

export type OntwormingplichtConfig = {
  actief: boolean
  beleid: string | null
  intervalMaanden: number | null
}

export const LEGE_ONTWORMINGPLICHT: OntwormingplichtConfig = {
  actief: false,
  beleid: null,
  intervalMaanden: null,
}

// ── Hoefsmid ─────────────────────────────────────────────────────────────────

export type HoefsmidplichtConfig = {
  actief: boolean
  intervalWeken: number | null
}

export const LEGE_HOEFSMIDPLICHT: HoefsmidplichtConfig = {
  actief: false,
  intervalWeken: null,
}

// ── Dierenarts-drempel ───────────────────────────────────────────────────────
// Bedrag (€) waarboven voorafgaande toestemming van de eigenaar vereist is, plus
// een vlag of er een meldingsplicht aan de eigenaar geldt.

export type DierenartsDrempelConfig = {
  actief: boolean
  bedrag: number | null
  meldingsplichtEigenaar: boolean
}

export const LEGE_DIERENARTS_DREMPEL: DierenartsDrempelConfig = {
  actief: false,
  bedrag: null,
  meldingsplichtEigenaar: false,
}

// ── Gecombineerd gezondheidsplicht-blok ──────────────────────────────────────

export type GezondheidsplichtConfig = {
  vaccinatie: VaccinatieplichtConfig
  ontworming: OntwormingplichtConfig
  hoefsmid: HoefsmidplichtConfig
  dierenartsDrempel: DierenartsDrempelConfig
}

export const LEGE_GEZONDHEIDSPLICHT: GezondheidsplichtConfig = {
  vaccinatie: { ...LEGE_VACCINATIEPLICHT, soorten: [] },
  ontworming: { ...LEGE_ONTWORMINGPLICHT },
  hoefsmid: { ...LEGE_HOEFSMIDPLICHT },
  dierenartsDrempel: { ...LEGE_DIERENARTS_DREMPEL },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tekstOfNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getalOfNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function isVaccinatieSoort(value: unknown): value is VaccinatieSoort {
  return typeof value === 'string' && value in VACCINATIE_SOORT_LABELS
}

// Leest het gezondheidsplicht-blok defensief uit het config-JSON van een contract.
// Onbekende/ontbrekende velden vallen terug op de lege standaard.
export function leesGezondheidsplicht(
  config: Prisma.JsonValue | null | undefined,
): GezondheidsplichtConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {
      vaccinatie: { ...LEGE_VACCINATIEPLICHT, soorten: [] },
      ontworming: { ...LEGE_ONTWORMINGPLICHT },
      hoefsmid: { ...LEGE_HOEFSMIDPLICHT },
      dierenartsDrempel: { ...LEGE_DIERENARTS_DREMPEL },
    }
  }
  const root = (config as Record<string, unknown>).gezondheidsplicht
  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return {
      vaccinatie: { ...LEGE_VACCINATIEPLICHT, soorten: [] },
      ontworming: { ...LEGE_ONTWORMINGPLICHT },
      hoefsmid: { ...LEGE_HOEFSMIDPLICHT },
      dierenartsDrempel: { ...LEGE_DIERENARTS_DREMPEL },
    }
  }
  const r = root as Record<string, unknown>

  // Vaccinatie
  const vaccinatieRaw =
    r.vaccinatie && typeof r.vaccinatie === 'object' && !Array.isArray(r.vaccinatie)
      ? (r.vaccinatie as Record<string, unknown>)
      : {}
  const soortenRaw = Array.isArray(vaccinatieRaw.soorten) ? vaccinatieRaw.soorten : []
  const soortenGekozen = soortenRaw.filter(isVaccinatieSoort)
  const vaccinatie: VaccinatieplichtConfig = {
    actief: vaccinatieRaw.actief === true,
    // Dedupliceren met behoud van de canonieke optie-volgorde.
    soorten: VACCINATIE_SOORT_OPTIES.filter((s) => soortenGekozen.includes(s)),
    intervalMaanden: getalOfNull(vaccinatieRaw.intervalMaanden),
  }

  // Ontworming
  const ontwormingRaw =
    r.ontworming && typeof r.ontworming === 'object' && !Array.isArray(r.ontworming)
      ? (r.ontworming as Record<string, unknown>)
      : {}
  const ontworming: OntwormingplichtConfig = {
    actief: ontwormingRaw.actief === true,
    beleid: tekstOfNull(ontwormingRaw.beleid),
    intervalMaanden: getalOfNull(ontwormingRaw.intervalMaanden),
  }

  // Hoefsmid
  const hoefsmidRaw =
    r.hoefsmid && typeof r.hoefsmid === 'object' && !Array.isArray(r.hoefsmid)
      ? (r.hoefsmid as Record<string, unknown>)
      : {}
  const hoefsmid: HoefsmidplichtConfig = {
    actief: hoefsmidRaw.actief === true,
    intervalWeken: getalOfNull(hoefsmidRaw.intervalWeken),
  }

  // Dierenarts-drempel
  const drempelRaw =
    r.dierenartsDrempel &&
    typeof r.dierenartsDrempel === 'object' &&
    !Array.isArray(r.dierenartsDrempel)
      ? (r.dierenartsDrempel as Record<string, unknown>)
      : {}
  const dierenartsDrempel: DierenartsDrempelConfig = {
    actief: drempelRaw.actief === true,
    bedrag: getalOfNull(drempelRaw.bedrag),
    meldingsplichtEigenaar: drempelRaw.meldingsplichtEigenaar === true,
  }

  return { vaccinatie, ontworming, hoefsmid, dierenartsDrempel }
}

// ── Labels voor weergave ─────────────────────────────────────────────────────

export function vaccinatieSoortLabel(soort: VaccinatieSoort): string {
  return VACCINATIE_SOORT_LABELS[soort]
}

// Koppelt een vrije Vaccination.type-tekst aan een verplichte soort op trefwoord.
export function vaccinatieTypeMatchtSoort(type: string, soort: VaccinatieSoort): boolean {
  const t = type.toLowerCase()
  return VACCINATIE_TREFWOORDEN[soort].some((w) => t.includes(w))
}

// ── Statusvergelijking tegen de gezondheidsregistratie ───────────────────────
// Afgeleide leeslogica: vergelijkt een afgesproken plicht-interval met de laatst
// geregistreerde gezondheidsgebeurtenis. Per onderdeel resulteert dit in één van:
//   - GEEN_REGISTRATIE : er is geen passende registratie gevonden
//   - UP_TO_DATE       : de eerstvolgende vervaldatum ligt comfortabel in de toekomst
//   - VERLOOPT_BINNENKORT : de vervaldatum ligt binnen de drempel (zie hieronder)
//   - VERLOPEN         : de vervaldatum ligt in het verleden
//
// De vervaldatum wordt bepaald uit nextDate wanneer beschikbaar; anders berekend
// uit de laatste registratiedatum + het afgesproken interval. Zo werkt de
// vergelijking ook wanneer er geen nextDate is geregistreerd.

export type NalevingStatus =
  | 'GEEN_REGISTRATIE'
  | 'UP_TO_DATE'
  | 'VERLOOPT_BINNENKORT'
  | 'VERLOPEN'

export const NALEVING_STATUS_LABELS: Record<NalevingStatus, string> = {
  GEEN_REGISTRATIE: 'Geen registratie',
  UP_TO_DATE: 'Up-to-date',
  VERLOOPT_BINNENKORT: 'Verloopt binnenkort',
  VERLOPEN: 'Verlopen',
}

// Badge-variant per nalevingsstatus, aansluitend op de bestaande .badge-* klassen.
export const NALEVING_STATUS_BADGE: Record<NalevingStatus, string> = {
  GEEN_REGISTRATIE: 'badge-neutral',
  UP_TO_DATE: 'badge-success',
  VERLOOPT_BINNENKORT: 'badge-warning',
  VERLOPEN: 'badge-danger',
}

// Eén herbruikbare "verloopt binnenkort"-grens voor alle drie de onderdelen.
export const VERLOOPT_BINNENKORT_DAGEN = 30

// Een minimale weergave van een geregistreerde gezondheidsgebeurtenis.
export type GezondheidRegistratie = {
  date: Date
  nextDate: Date | null
}

// Bepaalt de vervaldatum: nextDate indien aanwezig, anders date + interval (dagen).
function bepaalVervaldatum(
  registratie: GezondheidRegistratie,
  intervalDagen: number | null,
): Date | null {
  if (registratie.nextDate) return registratie.nextDate
  if (intervalDagen === null || intervalDagen <= 0) return null
  const d = new Date(registratie.date)
  d.setDate(d.getDate() + intervalDagen)
  return d
}

// Vergelijkt de laatst geregistreerde gebeurtenis met het afgesproken interval en
// geeft de nalevingsstatus terug. `intervalDagen` is het afgesproken interval
// omgerekend naar dagen (of null wanneer er geen interval is afgesproken).
export function bepaalNalevingStatus(
  laatste: GezondheidRegistratie | null,
  intervalDagen: number | null,
  vandaag: Date = new Date(),
): NalevingStatus {
  if (!laatste) return 'GEEN_REGISTRATIE'

  const referentie = new Date(vandaag)
  referentie.setHours(0, 0, 0, 0)

  const vervaldatum = bepaalVervaldatum(laatste, intervalDagen)
  // Zonder vervaldatum (geen nextDate en geen interval) is er wel een registratie,
  // maar kunnen we niet beoordelen of die verlopen is: beschouw als up-to-date.
  if (!vervaldatum) return 'UP_TO_DATE'

  if (vervaldatum < referentie) return 'VERLOPEN'

  const grens = new Date(referentie)
  grens.setDate(grens.getDate() + VERLOOPT_BINNENKORT_DAGEN)
  if (vervaldatum <= grens) return 'VERLOOPT_BINNENKORT'

  return 'UP_TO_DATE'
}

// Omrekenhulpen naar dagen voor de intervalvergelijking.
export function maandenNaarDagen(maanden: number | null): number | null {
  return maanden === null ? null : Math.round(maanden * 30)
}

export function wekenNaarDagen(weken: number | null): number | null {
  return weken === null ? null : Math.round(weken * 7)
}

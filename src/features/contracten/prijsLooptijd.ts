import type { Prisma } from '@prisma/client'

// ── Prijs, borg & looptijd (STAL-05) ─────────────────────────────────────────
// Vijfde optieblok van het stallingscontract (§3.2 looptijd + §3.3 prijs/borg).
// Net als bij STAL-03/STAL-04 worden de gegevens als JSON op het bestaande
// Contract.config-veld bewaard — hier onder de sleutel `prijsLooptijd`. Het schema
// hoeft dus niet te migreren en bestaande config-sleutels (huisvesting, voer,
// weidegang, faciliteiten) blijven staan. Nog géén facturatie: dit zijn enkel de
// vastgelegde voorwaarden.

// ── Pensionprijs ─────────────────────────────────────────────────────────────
// Bedrag per maand (frequentie is in v1 vast op "per maand"). De btw-vlag geeft
// aan of het bedrag incl. of excl. btw is; het btw-percentage is instelbaar.

export const BTW_MODUS_LABELS = {
  INCL: 'Inclusief btw',
  EXCL: 'Exclusief btw',
} as const

export type BtwModus = keyof typeof BTW_MODUS_LABELS

export const BTW_MODUS_OPTIES = Object.keys(BTW_MODUS_LABELS) as BtwModus[]

export type PrijsConfig = {
  // Bedrag in euro per maand; null wanneer (nog) niet ingevuld.
  bedrag: number | null
  btwModus: BtwModus
  btwPercentage: number | null
}

export const LEGE_PRIJS: PrijsConfig = {
  bedrag: null,
  btwModus: 'INCL',
  btwPercentage: 21,
}

// ── Borg ─────────────────────────────────────────────────────────────────────

export type BorgConfig = {
  actief: boolean
  bedrag: number | null
}

export const LEGE_BORG: BorgConfig = {
  actief: false,
  bedrag: null,
}

// ── Looptijd ─────────────────────────────────────────────────────────────────

export const LOOPTIJD_AARD_LABELS = {
  BEPAALD: 'Bepaalde tijd',
  ONBEPAALD: 'Onbepaalde tijd',
} as const

export type LooptijdAard = keyof typeof LOOPTIJD_AARD_LABELS

export const LOOPTIJD_AARD_OPTIES = Object.keys(LOOPTIJD_AARD_LABELS) as LooptijdAard[]

export const OPZEGTERMIJN_EENHEID_LABELS = {
  DAGEN: 'dagen',
  WEKEN: 'weken',
  MAANDEN: 'maanden',
} as const

export type OpzegtermijnEenheid = keyof typeof OPZEGTERMIJN_EENHEID_LABELS

export const OPZEGTERMIJN_EENHEID_OPTIES = Object.keys(
  OPZEGTERMIJN_EENHEID_LABELS,
) as OpzegtermijnEenheid[]

export const VERLENGING_LABELS = {
  STILZWIJGEND: 'Stilzwijgend (per maand/periode)',
  EXPLICIET: 'Expliciet verlengen',
  GEEN: 'Geen verlenging',
} as const

export type Verlenging = keyof typeof VERLENGING_LABELS

export const VERLENGING_OPTIES = Object.keys(VERLENGING_LABELS) as Verlenging[]

export const INDEXERING_MOMENT_LABELS = {
  JAARLIJKS: 'Jaarlijks',
  BIJ_VERLENGING: 'Bij verlenging',
} as const

export type IndexeringMoment = keyof typeof INDEXERING_MOMENT_LABELS

export const INDEXERING_MOMENT_OPTIES = Object.keys(
  INDEXERING_MOMENT_LABELS,
) as IndexeringMoment[]

export type OpzegtermijnConfig = {
  waarde: number
  eenheid: OpzegtermijnEenheid
  schriftelijk: boolean
}

export type ProefperiodeConfig = {
  actief: boolean
  // Vrije tekst, bv. "1 maand" of "4 weken"; null wanneer uit/niet ingevuld.
  duur: string | null
}

export type IndexeringConfig = {
  actief: boolean
  grondslag: string | null
  moment: IndexeringMoment | null
}

export type LooptijdConfig = {
  aard: LooptijdAard
  // Einddatum (ISO yyyy-mm-dd) bij bepaalde tijd; anders null.
  einddatum: string | null
  minimumperiode: string | null
  opzegtermijn: OpzegtermijnConfig
  verlenging: Verlenging
  proefperiode: ProefperiodeConfig
  indexering: IndexeringConfig
}

// Default opzegtermijn bij onbepaalde tijd: 1 kalendermaand, schriftelijk.
export const DEFAULT_OPZEGTERMIJN: OpzegtermijnConfig = {
  waarde: 1,
  eenheid: 'MAANDEN',
  schriftelijk: true,
}

export const LEGE_LOOPTIJD: LooptijdConfig = {
  aard: 'ONBEPAALD',
  einddatum: null,
  minimumperiode: null,
  opzegtermijn: { ...DEFAULT_OPZEGTERMIJN },
  verlenging: 'STILZWIJGEND',
  proefperiode: { actief: false, duur: null },
  indexering: { actief: false, grondslag: null, moment: null },
}

// ── Gecombineerd prijs/borg/looptijd-blok ────────────────────────────────────

export type PrijsLooptijdConfig = {
  prijs: PrijsConfig
  borg: BorgConfig
  looptijd: LooptijdConfig
}

export const LEEG_PRIJS_LOOPTIJD: PrijsLooptijdConfig = {
  prijs: { ...LEGE_PRIJS },
  borg: { ...LEGE_BORG },
  looptijd: {
    ...LEGE_LOOPTIJD,
    opzegtermijn: { ...DEFAULT_OPZEGTERMIJN },
    proefperiode: { actief: false, duur: null },
    indexering: { actief: false, grondslag: null, moment: null },
  },
}

// ── Compleetheid vóór aanbieden (STAL-08, #81) ───────────────────────────────
// Verplichte velden om een contract te mogen aanbieden: de pensionprijs én — bij
// bepaalde tijd — de einddatum. De helper geeft begrijpelijke labels van de
// ontbrekende velden terug, zodat zowel de server-poort als de UI ze kan gebruiken.
export function ontbrekendePrijsLooptijdVelden(blok: PrijsLooptijdConfig): string[] {
  const ontbreekt: string[] = []
  if (blok.prijs.bedrag === null) {
    ontbreekt.push('Pensionprijs')
  }
  if (blok.looptijd.aard === 'BEPAALD' && !blok.looptijd.einddatum) {
    ontbreekt.push('Einddatum (bij bepaalde tijd)')
  }
  return ontbreekt
}

// ── Validatie ────────────────────────────────────────────────────────────────
// Een opzegtermijn korter dan 1 kalendermaand. Wordt zowel client-side (waarschuwing)
// als ter informatie gebruikt; harde weigeringen gebeuren in de server-action.
export function isOpzegtermijnKorterDanMaand(termijn: OpzegtermijnConfig): boolean {
  if (termijn.eenheid === 'MAANDEN') return termijn.waarde < 1
  if (termijn.eenheid === 'WEKEN') return termijn.waarde < 4
  if (termijn.eenheid === 'DAGEN') return termijn.waarde < 30
  return false
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tekstOfNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getalOfNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function isBtwModus(value: unknown): value is BtwModus {
  return typeof value === 'string' && value in BTW_MODUS_LABELS
}

function isLooptijdAard(value: unknown): value is LooptijdAard {
  return typeof value === 'string' && value in LOOPTIJD_AARD_LABELS
}

function isOpzegtermijnEenheid(value: unknown): value is OpzegtermijnEenheid {
  return typeof value === 'string' && value in OPZEGTERMIJN_EENHEID_LABELS
}

function isVerlenging(value: unknown): value is Verlenging {
  return typeof value === 'string' && value in VERLENGING_LABELS
}

function isIndexeringMoment(value: unknown): value is IndexeringMoment {
  return typeof value === 'string' && value in INDEXERING_MOMENT_LABELS
}

// Leest het prijs/borg/looptijd-blok defensief uit het config-JSON van een
// contract. Onbekende/ontbrekende velden vallen terug op de lege standaard.
export function leesPrijsLooptijd(
  config: Prisma.JsonValue | null | undefined,
): PrijsLooptijdConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {
      prijs: { ...LEGE_PRIJS },
      borg: { ...LEGE_BORG },
      looptijd: {
        ...LEGE_LOOPTIJD,
        opzegtermijn: { ...DEFAULT_OPZEGTERMIJN },
        proefperiode: { actief: false, duur: null },
        indexering: { actief: false, grondslag: null, moment: null },
      },
    }
  }
  const root = (config as Record<string, unknown>).prijsLooptijd
  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return {
      prijs: { ...LEGE_PRIJS },
      borg: { ...LEGE_BORG },
      looptijd: {
        ...LEGE_LOOPTIJD,
        opzegtermijn: { ...DEFAULT_OPZEGTERMIJN },
        proefperiode: { actief: false, duur: null },
        indexering: { actief: false, grondslag: null, moment: null },
      },
    }
  }
  const r = root as Record<string, unknown>

  // Prijs
  const prijsRaw =
    r.prijs && typeof r.prijs === 'object' && !Array.isArray(r.prijs)
      ? (r.prijs as Record<string, unknown>)
      : {}
  const prijs: PrijsConfig = {
    bedrag: getalOfNull(prijsRaw.bedrag),
    btwModus: isBtwModus(prijsRaw.btwModus) ? prijsRaw.btwModus : 'INCL',
    btwPercentage: getalOfNull(prijsRaw.btwPercentage) ?? 21,
  }

  // Borg
  const borgRaw =
    r.borg && typeof r.borg === 'object' && !Array.isArray(r.borg)
      ? (r.borg as Record<string, unknown>)
      : {}
  const borg: BorgConfig = {
    actief: borgRaw.actief === true,
    bedrag: getalOfNull(borgRaw.bedrag),
  }

  // Looptijd
  const looptijdRaw =
    r.looptijd && typeof r.looptijd === 'object' && !Array.isArray(r.looptijd)
      ? (r.looptijd as Record<string, unknown>)
      : {}

  const opzegRaw =
    looptijdRaw.opzegtermijn &&
    typeof looptijdRaw.opzegtermijn === 'object' &&
    !Array.isArray(looptijdRaw.opzegtermijn)
      ? (looptijdRaw.opzegtermijn as Record<string, unknown>)
      : {}
  const opzegtermijn: OpzegtermijnConfig = {
    waarde: getalOfNull(opzegRaw.waarde) ?? DEFAULT_OPZEGTERMIJN.waarde,
    eenheid: isOpzegtermijnEenheid(opzegRaw.eenheid)
      ? opzegRaw.eenheid
      : DEFAULT_OPZEGTERMIJN.eenheid,
    schriftelijk: opzegRaw.schriftelijk !== false,
  }

  const proefRaw =
    looptijdRaw.proefperiode &&
    typeof looptijdRaw.proefperiode === 'object' &&
    !Array.isArray(looptijdRaw.proefperiode)
      ? (looptijdRaw.proefperiode as Record<string, unknown>)
      : {}
  const proefperiode: ProefperiodeConfig = {
    actief: proefRaw.actief === true,
    duur: tekstOfNull(proefRaw.duur),
  }

  const indexRaw =
    looptijdRaw.indexering &&
    typeof looptijdRaw.indexering === 'object' &&
    !Array.isArray(looptijdRaw.indexering)
      ? (looptijdRaw.indexering as Record<string, unknown>)
      : {}
  const indexering: IndexeringConfig = {
    actief: indexRaw.actief === true,
    grondslag: tekstOfNull(indexRaw.grondslag),
    moment: isIndexeringMoment(indexRaw.moment) ? indexRaw.moment : null,
  }

  const looptijd: LooptijdConfig = {
    aard: isLooptijdAard(looptijdRaw.aard) ? looptijdRaw.aard : 'ONBEPAALD',
    einddatum: tekstOfNull(looptijdRaw.einddatum),
    minimumperiode: tekstOfNull(looptijdRaw.minimumperiode),
    opzegtermijn,
    verlenging: isVerlenging(looptijdRaw.verlenging) ? looptijdRaw.verlenging : 'STILZWIJGEND',
    proefperiode,
    indexering,
  }

  return { prijs, borg, looptijd }
}

// ── Labels voor weergave ─────────────────────────────────────────────────────

export function btwModusLabel(modus: BtwModus): string {
  return BTW_MODUS_LABELS[modus]
}

export function looptijdAardLabel(aard: LooptijdAard): string {
  return LOOPTIJD_AARD_LABELS[aard]
}

export function verlengingLabel(verlenging: Verlenging): string {
  return VERLENGING_LABELS[verlenging]
}

export function opzegtermijnEenheidLabel(eenheid: OpzegtermijnEenheid): string {
  return OPZEGTERMIJN_EENHEID_LABELS[eenheid]
}

// Geeft de prijs als geformatteerde euro-string, of "—" wanneer niet ingevuld.
export function formatBedrag(bedrag: number | null): string {
  if (bedrag === null) return '—'
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(bedrag)
}

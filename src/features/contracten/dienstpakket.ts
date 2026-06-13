import type { Prisma } from '@prisma/client'

// ── Voer & verzorging, weidegang & faciliteiten (STAL-04) ────────────────────
// Tweede set optieblokken van het stallingscontract (§3.3). Net als bij STAL-03
// worden de opties als JSON op het bestaande Contract.config-veld bewaard — hier
// onder de sleutels `voer`, `weidegang` en `faciliteiten`. Het schema hoeft dus
// niet te migreren en bestaande config-sleutels (bv. `huisvesting`) blijven staan.

// ── Voer & verzorging ────────────────────────────────────────────────────────
// De velden worden in het bewerkscherm voorgevuld uit het FeedingPlan van het
// paard (roughage -> ruwvoer, concentrate -> krachtvoer), maar blijven daarna
// bewerkbaar en worden los op het contract bewaard.

export type VoerConfig = {
  ruwvoer: string | null
  krachtvoer: string | null
}

export const LEEG_VOER: VoerConfig = {
  ruwvoer: null,
  krachtvoer: null,
}

// ── Weidegang ────────────────────────────────────────────────────────────────

export const WEIDEGANG_VORM_LABELS = {
  INDIVIDUEEL: 'Individueel',
  GROEP: 'In groep',
} as const

export type WeidegangVorm = keyof typeof WEIDEGANG_VORM_LABELS

export const WEIDEGANG_VORM_OPTIES = Object.keys(WEIDEGANG_VORM_LABELS) as WeidegangVorm[]

export type WeidegangConfig = {
  actief: boolean
  vorm: WeidegangVorm | null
  urenPerDag: string | null
  seizoen: string | null
}

export const LEGE_WEIDEGANG: WeidegangConfig = {
  actief: false,
  vorm: null,
  urenPerDag: null,
  seizoen: null,
}

// ── Faciliteiten ─────────────────────────────────────────────────────────────

export const FACILITEIT_LABELS = {
  BINNENBAK: 'Binnenbak',
  BUITENBAK: 'Buitenbak',
  LONGEERPISTE: 'Longeerpiste',
  STAPMOLEN: 'Stapmolen',
  SOLARIUM: 'Solarium',
  WASPLAATS: 'Wasplaats',
} as const

export type Faciliteit = keyof typeof FACILITEIT_LABELS

export const FACILITEIT_OPTIES = Object.keys(FACILITEIT_LABELS) as Faciliteit[]

export type FaciliteitenConfig = {
  geselecteerd: Faciliteit[]
}

export const LEGE_FACILITEITEN: FaciliteitenConfig = {
  geselecteerd: [],
}

// ── Gecombineerd dienstpakket-blok ───────────────────────────────────────────

export type DienstpakketConfig = {
  voer: VoerConfig
  weidegang: WeidegangConfig
  faciliteiten: FaciliteitenConfig
}

export const LEEG_DIENSTPAKKET: DienstpakketConfig = {
  voer: { ...LEEG_VOER },
  weidegang: { ...LEGE_WEIDEGANG },
  faciliteiten: { geselecteerd: [] },
}

function isWeidegangVorm(value: unknown): value is WeidegangVorm {
  return typeof value === 'string' && value in WEIDEGANG_VORM_LABELS
}

function isFaciliteit(value: unknown): value is Faciliteit {
  return typeof value === 'string' && value in FACILITEIT_LABELS
}

function tekstOfNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

// Leest het dienstpakket (voer/weidegang/faciliteiten) defensief uit het config-
// JSON van een contract. Onbekende/ontbrekende velden vallen terug op de lege
// standaard.
export function leesDienstpakket(
  config: Prisma.JsonValue | null | undefined,
): DienstpakketConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { voer: { ...LEEG_VOER }, weidegang: { ...LEGE_WEIDEGANG }, faciliteiten: { geselecteerd: [] } }
  }
  const root = config as Record<string, unknown>

  // Voer
  const voerRaw =
    root.voer && typeof root.voer === 'object' && !Array.isArray(root.voer)
      ? (root.voer as Record<string, unknown>)
      : {}
  const voer: VoerConfig = {
    ruwvoer: tekstOfNull(voerRaw.ruwvoer),
    krachtvoer: tekstOfNull(voerRaw.krachtvoer),
  }

  // Weidegang
  const weidegangRaw =
    root.weidegang && typeof root.weidegang === 'object' && !Array.isArray(root.weidegang)
      ? (root.weidegang as Record<string, unknown>)
      : {}
  const weidegang: WeidegangConfig = {
    actief: weidegangRaw.actief === true,
    vorm: isWeidegangVorm(weidegangRaw.vorm) ? weidegangRaw.vorm : null,
    urenPerDag: tekstOfNull(weidegangRaw.urenPerDag),
    seizoen: tekstOfNull(weidegangRaw.seizoen),
  }

  // Faciliteiten
  const faciliteitenRaw = Array.isArray(root.faciliteiten) ? root.faciliteiten : []
  const geselecteerd = faciliteitenRaw.filter(isFaciliteit)
  // Dedupliceren met behoud van de canonieke optie-volgorde.
  const faciliteiten: FaciliteitenConfig = {
    geselecteerd: FACILITEIT_OPTIES.filter((f) => geselecteerd.includes(f)),
  }

  return { voer, weidegang, faciliteiten }
}

export function weidegangVormLabel(vorm: WeidegangVorm | null): string {
  return vorm ? WEIDEGANG_VORM_LABELS[vorm] : '—'
}

export function faciliteitLabel(faciliteit: Faciliteit): string {
  return FACILITEIT_LABELS[faciliteit]
}

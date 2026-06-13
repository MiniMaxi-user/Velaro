import type { Prisma } from '@prisma/client'

// ── Verzekering & aansprakelijkheid (STAL-06) ────────────────────────────────
// Zesde optieblok van het stallingscontract (§3.0/§3.3) — het juridisch
// gevoeligste deel. Net als bij STAL-03/04/05 worden de gegevens als JSON op het
// bestaande Contract.config-veld bewaard, hier onder de sleutel
// `verzekeringAansprakelijkheid`. Er is dus geen schemamigratie nodig en
// bestaande config-sleutels (huisvesting, voer, weidegang, faciliteiten,
// prijsLooptijd) blijven ongewijzigd.
//
// Een aantal velden is JURIDISCH VERPLICHT voordat een contract de status
// AANGEBODEN kan krijgen. Deze story levert het raamwerk + de datavelden + de
// validatiehulp; de harde blokkade bij aanbieden wordt afgedwongen in STAL-08
// (#81) via `verzekeringAansprakelijkheidCompleet` / `ontbrekendeVerplichteVelden`.

// ── Verzekering ──────────────────────────────────────────────────────────────
// WA-/aansprakelijkheidsverzekering van de eigenaar is verplicht: het paard moet
// door de eigenaar zelf verzekerd zijn. Polisnummer + verzekeraar horen daarbij.
// Brandverzekering van het paard is optioneel (ja/nee).

export type VerzekeringConfig = {
  // Verplicht: bevestiging dat de eigenaar een WA-/aansprakelijkheidsverzekering heeft.
  waVerzekeringEigenaar: boolean
  // Verplicht (bij waVerzekeringEigenaar): polisnummer en verzekeraar/maatschappij.
  polisnummer: string | null
  verzekeraar: string | null
  // Optioneel: brandverzekering voor het paard van toepassing.
  brandverzekeringPaard: boolean
  // Optioneel: bevestiging dat de eigenaar het paard zelf verzekert.
  eigenaarVerzekertZelf: boolean
}

export const LEGE_VERZEKERING: VerzekeringConfig = {
  waVerzekeringEigenaar: false,
  polisnummer: null,
  verzekeraar: null,
  brandverzekeringPaard: false,
  eigenaarVerzekertZelf: false,
}

// ── Aansprakelijkheid ────────────────────────────────────────────────────────
// Risico-acceptatie door de eigenaar is verplicht. De overige velden (bezitter-
// aansprakelijkheid art. 6:179 BW, bedrijfsmatig-gebruik-notitie art. 6:181 BW,
// zorgplicht stal, beperking aansprakelijkheid stal) zijn optioneel/raamwerk.

export type AansprakelijkheidConfig = {
  // Verplicht: de eigenaar accepteert het risico van stalling.
  risicoAcceptatieEigenaar: boolean
  // Optioneel: bezitter-aansprakelijkheid (art. 6:179 BW) erkend/vastgelegd.
  bezitterAansprakelijkheid: boolean
  // Optioneel notitieveld bedrijfsmatig gebruik (art. 6:181 BW). Bij full pension
  // zonder training NVT, maar het veld is aanwezig.
  bedrijfsmatigGebruikNotitie: string | null
  // Optioneel: de zorgplicht van de stal is vastgelegd.
  zorgplichtStal: boolean
  // Optioneel: aansprakelijkheid stal is beperkt en gekoppeld aan de dekking.
  aansprakelijkheidStalBeperkt: boolean
}

export const LEGE_AANSPRAKELIJKHEID: AansprakelijkheidConfig = {
  risicoAcceptatieEigenaar: false,
  bezitterAansprakelijkheid: false,
  bedrijfsmatigGebruikNotitie: null,
  zorgplichtStal: false,
  aansprakelijkheidStalBeperkt: false,
}

// ── Gecombineerd blok ────────────────────────────────────────────────────────

export type VerzekeringAansprakelijkheidConfig = {
  verzekering: VerzekeringConfig
  aansprakelijkheid: AansprakelijkheidConfig
}

export const LEEG_VERZEKERING_AANSPRAKELIJKHEID: VerzekeringAansprakelijkheidConfig = {
  verzekering: { ...LEGE_VERZEKERING },
  aansprakelijkheid: { ...LEGE_AANSPRAKELIJKHEID },
}

function tekstOfNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

// Leest het verzekering- & aansprakelijkheidsblok defensief uit het config-JSON
// van een contract. Onbekende/ontbrekende velden vallen terug op de lege standaard.
export function leesVerzekeringAansprakelijkheid(
  config: Prisma.JsonValue | null | undefined,
): VerzekeringAansprakelijkheidConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {
      verzekering: { ...LEGE_VERZEKERING },
      aansprakelijkheid: { ...LEGE_AANSPRAKELIJKHEID },
    }
  }
  const root = (config as Record<string, unknown>).verzekeringAansprakelijkheid
  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return {
      verzekering: { ...LEGE_VERZEKERING },
      aansprakelijkheid: { ...LEGE_AANSPRAKELIJKHEID },
    }
  }
  const r = root as Record<string, unknown>

  // Verzekering
  const verzekeringRaw =
    r.verzekering && typeof r.verzekering === 'object' && !Array.isArray(r.verzekering)
      ? (r.verzekering as Record<string, unknown>)
      : {}
  const verzekering: VerzekeringConfig = {
    waVerzekeringEigenaar: verzekeringRaw.waVerzekeringEigenaar === true,
    polisnummer: tekstOfNull(verzekeringRaw.polisnummer),
    verzekeraar: tekstOfNull(verzekeringRaw.verzekeraar),
    brandverzekeringPaard: verzekeringRaw.brandverzekeringPaard === true,
    eigenaarVerzekertZelf: verzekeringRaw.eigenaarVerzekertZelf === true,
  }

  // Aansprakelijkheid
  const aansprakelijkheidRaw =
    r.aansprakelijkheid &&
    typeof r.aansprakelijkheid === 'object' &&
    !Array.isArray(r.aansprakelijkheid)
      ? (r.aansprakelijkheid as Record<string, unknown>)
      : {}
  const aansprakelijkheid: AansprakelijkheidConfig = {
    risicoAcceptatieEigenaar: aansprakelijkheidRaw.risicoAcceptatieEigenaar === true,
    bezitterAansprakelijkheid: aansprakelijkheidRaw.bezitterAansprakelijkheid === true,
    bedrijfsmatigGebruikNotitie: tekstOfNull(aansprakelijkheidRaw.bedrijfsmatigGebruikNotitie),
    zorgplichtStal: aansprakelijkheidRaw.zorgplichtStal === true,
    aansprakelijkheidStalBeperkt: aansprakelijkheidRaw.aansprakelijkheidStalBeperkt === true,
  }

  return { verzekering, aansprakelijkheid }
}

// ── Validatie: compleetheid van de verplichte velden ─────────────────────────
// Verplicht-set (afgestemd in #79, open jurist-vraag): WA-/aansprakelijkheids-
// verzekering eigenaar + polisnummer + verzekeraar, en risico-acceptatie eigenaar.
//
// Stabiele, machine-leesbare sleutels voor de ontbrekende velden zodat STAL-08
// (#81) ze kan inzetten als poortcontrole bij aanbieden.
export const VERPLICHTE_VELDEN = {
  waVerzekeringEigenaar: 'WA-/aansprakelijkheidsverzekering eigenaar',
  polisnummer: 'Polisnummer',
  verzekeraar: 'Verzekeraar/maatschappij',
  risicoAcceptatieEigenaar: 'Risico-acceptatie eigenaar',
} as const

export type VerplichtVeld = keyof typeof VERPLICHTE_VELDEN

// Geeft de lijst ontbrekende verplichte velden terug (lege lijst = compleet).
export function ontbrekendeVerplichteVelden(
  blok: VerzekeringAansprakelijkheidConfig,
): VerplichtVeld[] {
  const ontbreekt: VerplichtVeld[] = []

  if (!blok.verzekering.waVerzekeringEigenaar) {
    ontbreekt.push('waVerzekeringEigenaar')
  }
  if (!blok.verzekering.polisnummer) {
    ontbreekt.push('polisnummer')
  }
  if (!blok.verzekering.verzekeraar) {
    ontbreekt.push('verzekeraar')
  }
  if (!blok.aansprakelijkheid.risicoAcceptatieEigenaar) {
    ontbreekt.push('risicoAcceptatieEigenaar')
  }

  return ontbreekt
}

// Herbruikbare poortcontrole voor STAL-08 (#81): `true` wanneer alle verplichte
// velden ingevuld zijn, anders `false`.
export function verzekeringAansprakelijkheidCompleet(
  blok: VerzekeringAansprakelijkheidConfig,
): boolean {
  return ontbrekendeVerplichteVelden(blok).length === 0
}

import type { Prisma } from '@prisma/client'

// ── Berijder (STAL-10) ───────────────────────────────────────────────────────
// Optioneel optieblok van het stallingscontract. Net als bij STAL-03 t/m STAL-07
// worden de gegevens als JSON op het bestaande Contract.config-veld bewaard — hier
// onder de sleutel `berijder`. Er is dus geen schemamigratie nodig en bestaande
// config-sleutels (huisvesting, voer, weidegang, faciliteiten, prijsLooptijd,
// verzekeringAansprakelijkheid, gezondheidsplicht) blijven ongewijzigd.
//
// Productbeslissing (14 juni 2026): een stallingscontract wordt altijd gesloten met
// een meerderjarige paardeigenaar. De (eventueel minderjarige) berijder wordt puur
// informatief op de overeenkomst benoemd; deze tekent niet en blokkeert het aanbieden
// niet. Het blok is daarom volledig optioneel — er is geen compleetheids-/verplicht-
// helper. De geboortedatum dient enkel om in de weergave een minderjarig-indicatie te
// kunnen tonen (zie isMinderjarig in src/features/paarden/paardHelpers.ts).

export type BerijderConfig = {
  // Naam van de berijder (vrije tekst). Leeg = geen berijder vastgelegd.
  naam: string | null
  // Optioneel: geboortedatum (ISO yyyy-mm-dd) om minderjarigheid af te leiden.
  geboortedatum: string | null
  // Optioneel: relatie tot de eigenaar (bv. zoon/dochter/pupil).
  relatieTotEigenaar: string | null
}

export const LEEG_BERIJDER: BerijderConfig = {
  naam: null,
  geboortedatum: null,
  relatieTotEigenaar: null,
}

function tekstOfNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

// Leest het berijder-blok defensief uit het config-JSON van een contract.
// Onbekende/ontbrekende velden vallen terug op de lege standaard.
export function leesBerijder(
  config: Prisma.JsonValue | null | undefined,
): BerijderConfig {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { ...LEEG_BERIJDER }
  }
  const root = (config as Record<string, unknown>).berijder
  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return { ...LEEG_BERIJDER }
  }
  const r = root as Record<string, unknown>

  return {
    naam: tekstOfNull(r.naam),
    geboortedatum: tekstOfNull(r.geboortedatum),
    relatieTotEigenaar: tekstOfNull(r.relatieTotEigenaar),
  }
}

// Helper voor de weergave: is er überhaupt een berijder vastgelegd? Een leeg blok
// (geen naam) toont geen berijder-sectie en blokkeert het aanbieden niet.
export function heeftBerijder(blok: BerijderConfig): boolean {
  return Boolean(blok.naam)
}

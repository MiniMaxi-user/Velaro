'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStableRole } from '@/lib/auth/authorization'
import { BOXTYPE_LABELS, type Boxtype, type HuisvestingConfig } from './huisvesting'
import {
  FACILITEIT_OPTIES,
  WEIDEGANG_VORM_LABELS,
  type DienstpakketConfig,
  type Faciliteit,
  type WeidegangVorm,
} from './dienstpakket'
import {
  BTW_MODUS_LABELS,
  LOOPTIJD_AARD_LABELS,
  OPZEGTERMIJN_EENHEID_LABELS,
  VERLENGING_LABELS,
  INDEXERING_MOMENT_LABELS,
  DEFAULT_OPZEGTERMIJN,
  type BtwModus,
  type LooptijdAard,
  type OpzegtermijnEenheid,
  type Verlenging,
  type IndexeringMoment,
  type PrijsLooptijdConfig,
} from './prijsLooptijd'
import type { VerzekeringAansprakelijkheidConfig } from './verzekeringAansprakelijkheid'

// Leest de huisvesting-opties (STAL-03) uit het formulier. Onbekende boxtypes
// vallen terug op null; lege tekstvelden worden genormaliseerd naar null.
function leesHuisvestingForm(formData: FormData): HuisvestingConfig {
  const boxtypeRaw = (formData.get('boxtype') as string)?.trim()
  const boxtype: Boxtype | null =
    boxtypeRaw && boxtypeRaw in BOXTYPE_LABELS ? (boxtypeRaw as Boxtype) : null
  const boxNumber = (formData.get('boxNumber') as string)?.trim() || null
  const beddingtype = (formData.get('beddingtype') as string)?.trim() || null
  const toezicht = (formData.get('toezicht') as string)?.trim() || null

  return {
    boxtype,
    boxNumber,
    uitmesten: formData.get('uitmesten') === 'true',
    opstrooien: formData.get('opstrooien') === 'true',
    beddingtype,
    toezicht,
  }
}

// Leest het dienstpakket (voer & verzorging, weidegang, faciliteiten — STAL-04)
// uit het formulier. Lege tekstvelden worden genormaliseerd naar null; onbekende
// keuzes vallen terug op null. Voervelden worden los van het FeedingPlan bewaard.
function leesDienstpakketForm(formData: FormData): DienstpakketConfig {
  const ruwvoer = (formData.get('voerRuwvoer') as string)?.trim() || null
  const krachtvoer = (formData.get('voerKrachtvoer') as string)?.trim() || null

  const vormRaw = (formData.get('weidegangVorm') as string)?.trim()
  const vorm: WeidegangVorm | null =
    vormRaw && vormRaw in WEIDEGANG_VORM_LABELS ? (vormRaw as WeidegangVorm) : null
  const urenPerDag = (formData.get('weidegangUren') as string)?.trim() || null
  const seizoen = (formData.get('weidegangSeizoen') as string)?.trim() || null

  // Faciliteiten als checkbox-set; alleen bekende opties, in canonieke volgorde.
  const aangevinkt = new Set(formData.getAll('faciliteiten').map((v) => String(v)))
  const geselecteerd: Faciliteit[] = FACILITEIT_OPTIES.filter((f) => aangevinkt.has(f))

  return {
    voer: { ruwvoer, krachtvoer },
    weidegang: {
      actief: formData.get('weidegangActief') === 'true',
      vorm,
      urenPerDag,
      seizoen,
    },
    faciliteiten: { geselecteerd },
  }
}

// Hulp: leest een niet-negatief bedrag/getal uit het formulier. Lege invoer -> null.
// Gooit een fout bij negatieve of onleesbare waarden (server-side validatie).
function leesNietNegatiefGetal(value: FormDataEntryValue | null, label: string): number | null {
  const raw = (value as string)?.trim()
  if (!raw) return null
  const n = Number(raw.replace(',', '.'))
  if (!Number.isFinite(n)) {
    throw new Error(`${label} moet een geldig getal zijn.`)
  }
  if (n < 0) {
    throw new Error(`${label} mag niet negatief zijn.`)
  }
  return n
}

// Leest prijs, borg & looptijd (STAL-05) uit het formulier en valideert server-side.
// De gegevens worden onder config.prijsLooptijd bewaard. Gooit bij overtreding van
// een acceptatiecriterium een fout (opslaan wordt geweigerd).
function leesPrijsLooptijdForm(formData: FormData): PrijsLooptijdConfig {
  // ── Prijs ──
  const bedrag = leesNietNegatiefGetal(formData.get('prijsBedrag'), 'De pensionprijs')
  const btwModusRaw = (formData.get('prijsBtwModus') as string)?.trim()
  const btwModus: BtwModus =
    btwModusRaw && btwModusRaw in BTW_MODUS_LABELS ? (btwModusRaw as BtwModus) : 'INCL'
  const btwPercentage = leesNietNegatiefGetal(
    formData.get('prijsBtwPercentage'),
    'Het btw-percentage',
  )

  // ── Borg ──
  const borgActief = formData.get('borgActief') === 'true'
  const borgBedrag = leesNietNegatiefGetal(formData.get('borgBedrag'), 'Het borgbedrag')
  if (borgActief && borgBedrag === null) {
    throw new Error('Vul een borgbedrag in wanneer borg is ingeschakeld.')
  }

  // ── Looptijd ──
  const aardRaw = (formData.get('looptijdAard') as string)?.trim()
  const aard: LooptijdAard =
    aardRaw && aardRaw in LOOPTIJD_AARD_LABELS ? (aardRaw as LooptijdAard) : 'ONBEPAALD'

  const einddatum = (formData.get('looptijdEinddatum') as string)?.trim() || null
  if (aard === 'BEPAALD' && !einddatum) {
    throw new Error('Vul een einddatum in bij een contract voor bepaalde tijd.')
  }

  const minimumperiode = (formData.get('looptijdMinimumperiode') as string)?.trim() || null

  const opzegWaardeRaw = leesNietNegatiefGetal(
    formData.get('opzegtermijnWaarde'),
    'De opzegtermijn',
  )
  const opzegEenheidRaw = (formData.get('opzegtermijnEenheid') as string)?.trim()
  const opzegEenheid: OpzegtermijnEenheid =
    opzegEenheidRaw && opzegEenheidRaw in OPZEGTERMIJN_EENHEID_LABELS
      ? (opzegEenheidRaw as OpzegtermijnEenheid)
      : DEFAULT_OPZEGTERMIJN.eenheid
  const opzegtermijn = {
    waarde: opzegWaardeRaw ?? DEFAULT_OPZEGTERMIJN.waarde,
    eenheid: opzegEenheid,
    schriftelijk: formData.get('opzegtermijnSchriftelijk') !== 'false',
  }

  const verlengingRaw = (formData.get('looptijdVerlenging') as string)?.trim()
  const verlenging: Verlenging =
    verlengingRaw && verlengingRaw in VERLENGING_LABELS
      ? (verlengingRaw as Verlenging)
      : 'STILZWIJGEND'

  const proefActief = formData.get('proefperiodeActief') === 'true'
  const proefDuur = (formData.get('proefperiodeDuur') as string)?.trim() || null

  const indexActief = formData.get('indexeringActief') === 'true'
  const indexGrondslag = (formData.get('indexeringGrondslag') as string)?.trim() || null
  const indexMomentRaw = (formData.get('indexeringMoment') as string)?.trim()
  const indexMoment: IndexeringMoment | null =
    indexMomentRaw && indexMomentRaw in INDEXERING_MOMENT_LABELS
      ? (indexMomentRaw as IndexeringMoment)
      : null

  return {
    prijs: {
      bedrag,
      btwModus,
      btwPercentage: btwPercentage ?? 21,
    },
    borg: {
      actief: borgActief,
      bedrag: borgActief ? borgBedrag : null,
    },
    looptijd: {
      aard,
      einddatum: aard === 'BEPAALD' ? einddatum : null,
      minimumperiode,
      opzegtermijn,
      verlenging,
      proefperiode: { actief: proefActief, duur: proefActief ? proefDuur : null },
      indexering: {
        actief: indexActief,
        grondslag: indexActief ? indexGrondslag : null,
        moment: indexActief ? indexMoment : null,
      },
    },
  }
}

// Leest het verzekerings- & aansprakelijkheidsblok (STAL-06) uit het formulier.
// De gegevens worden onder config.verzekeringAansprakelijkheid bewaard. Niet-
// verplichte velden mogen leeg blijven; de compleetheid van de verplichte velden
// wordt niet hier afgedwongen maar via de validatiehulp (poort in STAL-08 #81),
// zodat een onvolledig blok wél als concept opgeslagen kan worden.
function leesVerzekeringAansprakelijkheidForm(
  formData: FormData,
): VerzekeringAansprakelijkheidConfig {
  const polisnummer = (formData.get('verzPolisnummer') as string)?.trim() || null
  const verzekeraar = (formData.get('verzVerzekeraar') as string)?.trim() || null
  const bedrijfsmatigGebruikNotitie =
    (formData.get('aansprBedrijfsmatigNotitie') as string)?.trim() || null

  return {
    verzekering: {
      waVerzekeringEigenaar: formData.get('verzWaEigenaar') === 'true',
      polisnummer,
      verzekeraar,
      brandverzekeringPaard: formData.get('verzBrandPaard') === 'true',
      eigenaarVerzekertZelf: formData.get('verzEigenaarVerzekertZelf') === 'true',
    },
    aansprakelijkheid: {
      risicoAcceptatieEigenaar: formData.get('aansprRisicoAcceptatie') === 'true',
      bezitterAansprakelijkheid: formData.get('aansprBezitter') === 'true',
      bedrijfsmatigGebruikNotitie,
      zorgplichtStal: formData.get('aansprZorgplichtStal') === 'true',
      aansprakelijkheidStalBeperkt: formData.get('aansprStalBeperkt') === 'true',
    },
  }
}

// Autorisatie: alleen OWNER/STAFF van de stal van het paard mag contracten van dat
// paard aanmaken. Server-side afgedwongen — paardeigenaren worden geweigerd.
async function getAuthorizedStaff(horseId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const horse = await prisma.horse.findUnique({ where: { id: horseId } })
  if (!horse) throw new Error('Paard niet gevonden')

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) throw new Error('Geen toegang')

  return { user, horse, role }
}

// Maakt een concept-stallingscontract (full pension) aan op een paard.
// family=STALLING, type=FULL_PENSION, status=CONCEPT, currentVersion=1.
export async function createStallingContract(horseId: string, formData: FormData) {
  const { horse } = await getAuthorizedStaff(horseId)

  const counterpartyUserId = (formData.get('counterpartyUserId') as string)?.trim()
  const startDateStr = (formData.get('startDate') as string)?.trim()

  if (!counterpartyUserId) {
    throw new Error('Kies een wederpartij (paardeigenaar).')
  }

  // De wederpartij moet een eigenaar van dit paard zijn.
  const ownerLink = await prisma.horsePerson.findUnique({
    where: { horseId_userId: { horseId, userId: counterpartyUserId } },
  })
  if (!ownerLink || !ownerLink.isOwner) {
    throw new Error('De gekozen wederpartij is geen eigenaar van dit paard.')
  }

  await prisma.contract.create({
    data: {
      horseId,
      stableId: horse.stableId,
      family: 'STALLING',
      type: 'FULL_PENSION',
      status: 'CONCEPT',
      currentVersion: 1,
      counterpartyUserId,
      startDate: startDateStr ? new Date(startDateStr) : null,
    },
  })

  revalidatePath(`/paarden/${horseId}`)
  redirect(`/paarden/${horseId}?tab=contracten`)
}

// Haalt een contract op en dwingt af dat het bij het opgegeven paard hoort, dat de
// huidige gebruiker OWNER/STAFF van de stal is, én dat het contract status CONCEPT
// heeft. Bewerken/verwijderen mag uitsluitend bij CONCEPT — server-side afgedwongen.
async function getEditableConceptContract(horseId: string, contractId: string) {
  const { horse } = await getAuthorizedStaff(horseId)

  const contract = await prisma.contract.findUnique({ where: { id: contractId } })
  if (!contract || contract.horseId !== horseId) {
    throw new Error('Contract niet gevonden')
  }
  if (contract.status !== 'CONCEPT') {
    throw new Error('Alleen een concept-contract kan worden bewerkt of verwijderd.')
  }

  return { horse, contract }
}

// Werkt de basisvelden (wederpartij + ingangsdatum) van een concept-contract bij.
export async function updateStallingContract(
  horseId: string,
  contractId: string,
  formData: FormData,
) {
  const { contract } = await getEditableConceptContract(horseId, contractId)

  const counterpartyUserId = (formData.get('counterpartyUserId') as string)?.trim()
  const startDateStr = (formData.get('startDate') as string)?.trim()

  if (!counterpartyUserId) {
    throw new Error('Kies een wederpartij (paardeigenaar).')
  }

  // De wederpartij moet een eigenaar van dit paard zijn.
  const ownerLink = await prisma.horsePerson.findUnique({
    where: { horseId_userId: { horseId, userId: counterpartyUserId } },
  })
  if (!ownerLink || !ownerLink.isOwner) {
    throw new Error('De gekozen wederpartij is geen eigenaar van dit paard.')
  }

  // Huisvesting-opties (STAL-03) en het dienstpakket (voer/weidegang/faciliteiten,
  // STAL-04) als JSON-blokken onder config bewaren. Bestaande config-sleutels van
  // andere stories blijven behouden.
  const huisvesting = leesHuisvestingForm(formData)
  const dienstpakket = leesDienstpakketForm(formData)
  // Prijs, borg & looptijd (STAL-05) — server-side gevalideerd in de reader.
  const prijsLooptijd = leesPrijsLooptijdForm(formData)
  // Verzekering & aansprakelijkheid (STAL-06). Optionele velden mogen leeg blijven;
  // de compleetheid van de verplichte velden is een poort bij aanbieden (STAL-08).
  const verzekeringAansprakelijkheid = leesVerzekeringAansprakelijkheidForm(formData)
  const bestaandeConfig =
    contract.config && typeof contract.config === 'object' && !Array.isArray(contract.config)
      ? (contract.config as Record<string, unknown>)
      : {}
  const nieuweConfig = {
    ...bestaandeConfig,
    huisvesting,
    voer: dienstpakket.voer,
    weidegang: dienstpakket.weidegang,
    faciliteiten: dienstpakket.faciliteiten.geselecteerd,
    prijsLooptijd,
    verzekeringAansprakelijkheid,
  }

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      counterpartyUserId,
      startDate: startDateStr ? new Date(startDateStr) : null,
      config: nieuweConfig,
    },
  })

  revalidatePath(`/paarden/${horseId}`)
  redirect(`/paarden/${horseId}?tab=contracten`)
}

// Verwijdert een concept-contract definitief.
export async function deleteStallingContract(horseId: string, contractId: string) {
  await getEditableConceptContract(horseId, contractId)

  await prisma.contract.delete({ where: { id: contractId } })

  revalidatePath(`/paarden/${horseId}`)
}

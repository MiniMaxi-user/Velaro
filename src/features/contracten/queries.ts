import { prisma } from '@/lib/prisma'
import {
  bepaalNalevingStatus,
  maandenNaarDagen,
  vaccinatieTypeMatchtSoort,
  wekenNaarDagen,
  type GezondheidsplichtConfig,
  type NalevingStatus,
  type VaccinatieSoort,
} from './gezondheidsplicht'

// Haalt de contracten van een paard op, nieuwste eerst, inclusief de wederpartij.
export async function getContractsForHorse(horseId: string) {
  return prisma.contract.findMany({
    where: { horseId },
    include: {
      counterparty: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Haalt het aan een eigenaar aangeboden contract voor een paard op (STAL-09, #82).
// Geeft uitsluitend een contract terug dat status AANGEBODEN heeft én waarvan de
// opgegeven gebruiker de gekoppelde wederpartij (counterpartyUserId) is. Zo ziet de
// eigenaar in zijn weergave alleen een te beoordelen aanbod voor zijn eigen paard.
// Geen aanbod (of geen koppeling) → null, zodat de accepteer-/afwijs-acties niet
// getoond worden.
export async function getAangebodenContractVoorEigenaar(
  horseId: string,
  userId: string,
) {
  return prisma.contract.findFirst({
    where: {
      horseId,
      status: 'AANGEBODEN',
      counterpartyUserId: userId,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Eén regel in de nalevings-weergave: een actief plicht-onderdeel met de
// vastgestelde status t.o.v. de gezondheidsregistratie van het paard.
export type NalevingRegel = {
  onderdeel: string
  status: NalevingStatus
}

// Vergelijkt de afgesproken entings-/gezondheidsplicht (STAL-07) met de laatst
// geregistreerde gezondheidsgebeurtenissen van het paard. Alleen-lezen afgeleide
// logica: per actief plicht-onderdeel wordt de nalevingsstatus bepaald. Uitgeschakelde
// onderdelen leveren geen regel op. Wordt server-side aangeroepen vanaf de
// contract-weergave; geeft een lege lijst terug wanneer er geen actieve plicht is.
export async function getGezondheidsplichtNaleving(
  horseId: string,
  plicht: GezondheidsplichtConfig,
): Promise<NalevingRegel[]> {
  const heeftActievePlicht =
    plicht.vaccinatie.actief || plicht.ontworming.actief || plicht.hoefsmid.actief
  if (!heeftActievePlicht) return []

  const vandaag = new Date()
  const regels: NalevingRegel[] = []

  // ── Vaccinatie ──
  if (plicht.vaccinatie.actief) {
    const intervalDagen = maandenNaarDagen(plicht.vaccinatie.intervalMaanden)
    // Wanneer specifieke soorten verplicht zijn, beoordelen we per soort; anders
    // de meest recente vaccinatie als geheel.
    const soorten: (VaccinatieSoort | null)[] =
      plicht.vaccinatie.soorten.length > 0 ? plicht.vaccinatie.soorten : [null]

    for (const soort of soorten) {
      const vaccinaties = await prisma.vaccination.findMany({
        where: { horseId },
        orderBy: { date: 'desc' },
        select: { date: true, nextDate: true, type: true },
      })
      const passend = soort
        ? vaccinaties.find((v) => vaccinatieTypeMatchtSoort(v.type, soort))
        : vaccinaties[0]
      const status = bepaalNalevingStatus(
        passend ? { date: passend.date, nextDate: passend.nextDate } : null,
        intervalDagen,
        vandaag,
      )
      regels.push({
        onderdeel: soort ? `Vaccinatie — ${soort.toLowerCase()}` : 'Vaccinatie',
        status,
      })
    }
  }

  // ── Ontworming / mestonderzoek ──
  if (plicht.ontworming.actief) {
    const intervalDagen = maandenNaarDagen(plicht.ontworming.intervalMaanden)
    const laatste = await prisma.deworming.findFirst({
      where: { horseId },
      orderBy: { date: 'desc' },
      select: { date: true, nextDate: true },
    })
    regels.push({
      onderdeel: 'Ontworming / mestonderzoek',
      status: bepaalNalevingStatus(laatste, intervalDagen, vandaag),
    })
  }

  // ── Hoefsmid ──
  if (plicht.hoefsmid.actief) {
    const intervalDagen = wekenNaarDagen(plicht.hoefsmid.intervalWeken)
    const laatste = await prisma.hoefsmitBezoek.findFirst({
      where: { horseId },
      orderBy: { date: 'desc' },
      select: { date: true, nextDate: true },
    })
    regels.push({
      onderdeel: 'Hoefverzorging',
      status: bepaalNalevingStatus(laatste, intervalDagen, vandaag),
    })
  }

  return regels
}

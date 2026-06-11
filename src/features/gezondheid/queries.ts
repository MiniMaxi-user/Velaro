import { prisma } from '@/lib/prisma'

export async function getVaccinaties(horseId: string) {
  return prisma.vaccination.findMany({
    where: { horseId },
    orderBy: { date: 'desc' },
  })
}

export async function getVaccinatie(id: string) {
  return prisma.vaccination.findUnique({ where: { id } })
}

export async function getOntwormingen(horseId: string) {
  return prisma.deworming.findMany({
    where: { horseId },
    orderBy: { date: 'desc' },
  })
}

export async function getOntworming(id: string) {
  return prisma.deworming.findUnique({ where: { id } })
}

export async function getDierenartsBezzoeken(horseId: string) {
  return prisma.vetVisit.findMany({
    where: { horseId },
    orderBy: { date: 'desc' },
  })
}

export async function getDierenartsBeezoek(id: string) {
  return prisma.vetVisit.findUnique({ where: { id } })
}

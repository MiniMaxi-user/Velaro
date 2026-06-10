import { prisma } from '@/lib/prisma'

export async function getVaccinaties(horseId: string) {
  return prisma.vaccination.findMany({
    where: { horseId },
    orderBy: { date: 'desc' },
  })
}

export async function getOntwormingen(horseId: string) {
  return prisma.deworming.findMany({
    where: { horseId },
    orderBy: { date: 'desc' },
  })
}

export async function getDierenartsBezzoeken(horseId: string) {
  return prisma.vetVisit.findMany({
    where: { horseId },
    orderBy: { date: 'desc' },
  })
}

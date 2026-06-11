import { prisma } from '@/lib/prisma'

export async function getAllStables() {
  return prisma.stable.findMany({
    include: {
      _count: { select: { horses: true, members: true } },
      members: {
        where: { role: 'OWNER' },
        include: { user: { select: { name: true, email: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllHorses() {
  return prisma.horse.findMany({
    include: {
      stable: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getOwnerAccounts() {
  return prisma.user.findMany({
    where: { isPlatformAdmin: false },
    include: {
      _count: {
        select: { stableMemberships: { where: { role: 'OWNER' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOwnerAccount(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      stableMemberships: {
        where: { role: 'OWNER' },
        include: { stable: { select: { id: true, name: true, city: true } } },
      },
    },
  })
}

import { prisma } from '@/lib/prisma'

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

import { prisma } from '@/lib/prisma'

export async function getUserOwnedStables(userId: string) {
  return prisma.stableMember.findMany({
    where: { userId, role: 'OWNER' },
    include: {
      stable: {
        include: {
          _count: { select: { horses: true, members: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

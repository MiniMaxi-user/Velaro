import { prisma } from '@/lib/prisma'

export async function getRecurringTasksForStable(stableId: string) {
  return prisma.recurringTask.findMany({
    where: { stableId, isActive: true },
    include: { horse: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getTasksForDate(stableId: string, date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return prisma.task.findMany({
    where: { stableId, date: { gte: start, lte: end } },
    include: { horse: { select: { id: true, name: true } } },
    orderBy: [{ isCompleted: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function getTaskCountsForDate(stableId: string, date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const [total, completed] = await Promise.all([
    prisma.task.count({ where: { stableId, date: { gte: start, lte: end } } }),
    prisma.task.count({ where: { stableId, date: { gte: start, lte: end }, isCompleted: true } }),
  ])
  return { total, completed }
}

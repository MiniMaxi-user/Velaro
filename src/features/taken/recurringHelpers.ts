import type { RecurringFreq } from '@prisma/client'

type RecurringTaskTemplate = {
  frequency: RecurringFreq
  dayOfWeek: number | null
  dayOfMonth: number | null
  createdAt: Date
}

/**
 * Controleert of een RecurringTask-sjabloon op de gegeven datum actief moet zijn.
 * Sjablonen die na de gegeven datum zijn aangemaakt genereren geen taken voor
 * datums in het verleden.
 */
export function shouldRunToday(task: RecurringTaskTemplate, date: Date): boolean {
  // Geen taken genereren voor datums vóór de aanmaamdatum van het sjabloon
  const createdDay = new Date(task.createdAt)
  createdDay.setHours(0, 0, 0, 0)
  const targetDay = new Date(date)
  targetDay.setHours(0, 0, 0, 0)
  if (targetDay < createdDay) return false

  switch (task.frequency) {
    case 'DAILY':
      return true

    case 'WEEKLY': {
      // 0=maandag t/m 6=zondag
      const weekday = (date.getDay() + 6) % 7
      return weekday === task.dayOfWeek
    }

    case 'MONTHLY': {
      return date.getDate() === task.dayOfMonth
    }

    default:
      return false
  }
}

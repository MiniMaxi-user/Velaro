import type { HorseSex } from '@prisma/client'

export const DISCIPLINE_OPTIES = [
  'Dressuur',
  'Springen',
  'Eventing',
  'Mennen',
  'Overig',
] as const

export const GESLACHT_LABELS: Record<HorseSex, string> = {
  MARE: 'Merrie',
  STALLION: 'Hengst',
  GELDING: 'Ruin',
}

export function berekenLeeftijd(dateOfBirth: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const m = today.getMonth() - dateOfBirth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) age--
  return age
}

export function formatDatum(date: Date): string {
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateForInput(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

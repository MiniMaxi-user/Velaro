'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStableRole } from '@/lib/auth/authorization'
import { getUserStable } from '@/features/paarden/queries'

async function getStaffContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stable = await getUserStable(user.id)
  if (!stable) throw new Error('Geen stal gevonden')

  const role = await getStableRole(user.id, stable.id)
  if (!role) throw new Error('Geen toegang')

  return { userId: user.id, stable }
}

export async function createTask(formData: FormData) {
  const { stable } = await getStaffContext()

  const title = (formData.get('title') as string)?.trim()
  const dateStr = formData.get('date') as string
  const horseId = (formData.get('horseId') as string) || null

  if (!title) throw new Error('Omschrijving is verplicht')
  if (!dateStr) throw new Error('Datum is verplicht')

  const date = new Date(dateStr)

  await prisma.task.create({
    data: {
      stableId: stable.id,
      horseId: horseId || null,
      title,
      date,
    },
  })

  revalidatePath('/stal/taken')
}

export async function toggleTask(taskId: string) {
  const { stable } = await getStaffContext()

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.stableId !== stable.id) throw new Error('Taak niet gevonden')

  await prisma.task.update({
    where: { id: taskId },
    data: {
      isCompleted: !task.isCompleted,
      completedAt: task.isCompleted ? null : new Date(),
    },
  })

  revalidatePath('/stal/taken')
}

export async function deleteTask(taskId: string) {
  const { stable } = await getStaffContext()

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.stableId !== stable.id) throw new Error('Taak niet gevonden')

  await prisma.task.delete({ where: { id: taskId } })

  revalidatePath('/stal/taken')
}

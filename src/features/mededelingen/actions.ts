'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStableRole } from '@/lib/auth/authorization'

async function getAuthorizedStableMember(horseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const horse = await prisma.horse.findUnique({ where: { id: horseId } })
  if (!horse) throw new Error('Paard niet gevonden')

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) throw new Error('Geen toegang')

  return { user, horse, role }
}

export async function createNote(horseId: string, formData: FormData) {
  const { user } = await getAuthorizedStableMember(horseId)

  const message = (formData.get('message') as string)?.trim()
  if (!message) throw new Error('Bericht is verplicht')

  await prisma.stableNote.create({
    data: { horseId, authorId: user.id, message },
  })

  revalidatePath(`/paarden/${horseId}`)
}

export async function deleteNote(id: string, horseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const note = await prisma.stableNote.findUnique({ where: { id } })
  if (!note || note.horseId !== horseId) throw new Error('Mededeling niet gevonden')

  const horse = await prisma.horse.findUnique({ where: { id: horseId } })
  if (!horse) throw new Error('Paard niet gevonden')

  const role = await getStableRole(user.id, horse.stableId)
  const isAuthor = note.authorId === user.id
  const isOwner = role === 'OWNER'

  if (!isAuthor && !isOwner) throw new Error('Geen toegang')

  await prisma.stableNote.delete({ where: { id } })
  revalidatePath(`/paarden/${horseId}`)
}

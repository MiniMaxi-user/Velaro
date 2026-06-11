'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { canCreateStable } from '@/lib/auth/authorization'
import { activeStableCookieName } from '@/lib/active-stable'

export async function createStable(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const canCreate = await canCreateStable(user.id)
  if (!canCreate) throw new Error('Je hebt het maximale aantal stallen bereikt. Neem contact op met Velaro om je quotum te verhogen.')

  const name = (formData.get('name') as string)?.trim()
  const address = (formData.get('address') as string)?.trim() || null
  const postalCode = (formData.get('postalCode') as string)?.trim() || null
  const city = (formData.get('city') as string)?.trim() || null

  if (!name) throw new Error('Stalnaam is verplicht')

  const stable = await prisma.stable.create({
    data: {
      name,
      address,
      postalCode,
      city,
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(activeStableCookieName(), stable.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  revalidatePath('/stallen')
  redirect('/stal')
}

export async function switchActiveStable(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stableId = formData.get('stableId') as string
  if (!stableId) return

  const member = await prisma.stableMember.findUnique({
    where: { stableId_userId: { stableId, userId: user.id } },
  })
  if (!member) throw new Error('Geen toegang tot deze stal')

  const cookieStore = await cookies()
  cookieStore.set(activeStableCookieName(), stableId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  redirect('/stal')
}

export async function updateStable(stableId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Alleen de OWNER mag de stalgegevens bewerken
  const member = await prisma.stableMember.findUnique({
    where: { stableId_userId: { stableId, userId: user.id } },
  })
  if (!member || member.role !== 'OWNER') throw new Error('Geen toegang')

  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('Stalnaam is verplicht')

  const str = (key: string) => (formData.get(key) as string)?.trim() || null

  await prisma.stable.update({
    where: { id: stableId },
    data: {
      name,
      address:           str('address'),
      postalCode:        str('postalCode'),
      city:              str('city'),
      phone:             str('phone'),
      email:             str('email'),
      website:           str('website'),
      description:       str('description'),
      openingHours:      str('openingHours'),
      invoiceAddress:    str('invoiceAddress'),
      invoicePostalCode: str('invoicePostalCode'),
      invoiceCity:       str('invoiceCity'),
    },
  })

  revalidatePath('/stallen')
  revalidatePath(`/stallen/${stableId}/bewerken`)
  redirect('/stallen')
}

import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { isPlatformAdmin } from '@/lib/auth/authorization'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const isAdmin = await isPlatformAdmin(user.id)
  if (!isAdmin) redirect('/stal')

  return <>{children}</>
}

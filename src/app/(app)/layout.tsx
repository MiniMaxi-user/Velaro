import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()

  if (!user) redirect('/login')

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Topbar />
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  )
}

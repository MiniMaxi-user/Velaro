import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canCreateStable } from '@/lib/auth/authorization'
import StalNieuwForm from '@/features/stallen/StalNieuwForm'

export default async function NieuweStalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const canCreate = await canCreateStable(user.id)
  if (!canCreate) redirect('/stallen')

  return (
    <main className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link href="/stallen">Mijn stallen</Link>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Nieuwe stal</span>
          </div>
          <h1 className="page-title">Nieuwe <em>stal</em></h1>
        </div>
        <Link href="/stallen" className="btn-ghost">← Terug</Link>
      </div>

      <div className="form-card" style={{ maxWidth: 520 }}>
        <StalNieuwForm />
      </div>
    </main>
  )
}

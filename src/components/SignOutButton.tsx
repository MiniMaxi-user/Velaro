'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  collapsed?: boolean
}

export default function SignOutButton({ collapsed }: Props) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="sidebar-toggle-btn"
      title="Uitloggen"
      aria-label="Uitloggen"
    >
      ⏻
    </button>
  )
}

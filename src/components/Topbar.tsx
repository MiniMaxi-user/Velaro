import { getAuthUser, getDbUser } from '@/lib/auth/session'
import TopbarUserMenu from './TopbarUserMenu'
import TopbarSearch from './TopbarSearch'

export default async function Topbar() {
  const user = await getAuthUser()

  let displayName = user?.email?.split('@')[0] ?? 'Gebruiker'
  let initials = displayName.slice(0, 2).toUpperCase()

  if (user) {
    const dbUser = await getDbUser(user.id)
    if (dbUser?.name) {
      displayName = dbUser.name
      const parts = dbUser.name.trim().split(' ')
      initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : dbUser.name.slice(0, 2).toUpperCase()
    }
  }

  return (
    <header className="topbar">
      <TopbarSearch />
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="topbar-icon-btn" title="Meldingen" aria-label="Meldingen">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a5 5 0 0 1 5 5v2.5l1 1.5H2l1-1.5V6a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="topbar-divider" />
        <TopbarUserMenu initials={initials} displayName={displayName} />
      </div>
    </header>
  )
}

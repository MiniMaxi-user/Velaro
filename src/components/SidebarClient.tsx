'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import SignOutButton from './SignOutButton'

const STAL_NAV = [
  { href: '/stal',      label: 'Dashboard',  icon: '⊞', exact: true },
  { href: '/paarden',   label: 'Paarden',    icon: '🐴', exact: false },
  { href: '/stal/taken', label: 'Taken',     icon: '✓',  exact: false },
  { href: '/stal/leden', label: 'Team',      icon: '👥', exact: false },
]

const EIGENAAR_NAV = [
  { href: '/paarden', label: 'Mijn paarden', icon: '🐴', exact: false },
]

interface Props {
  isStableMember: boolean
  userEmail: string | undefined
  userRole?: string
}

export default function SidebarClient({ isStableMember, userEmail, userRole }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const links = isStableMember ? STAL_NAV : EIGENAAR_NAV

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : 'VL'

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
        <Image
          src="/velaro_logo_white.png"
          alt="Velaro"
          height={24}
          width={120}
          priority
          className="sidebar-logo-img"
        />
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && (
            <div className="nav-section-label">Navigatie</div>
          )}
          {links.map(({ href, label, icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{userEmail ?? 'Gebruiker'}</div>
          {userRole && <div className="sidebar-user-role">{userRole}</div>}
        </div>
        <SignOutButton collapsed={collapsed} />
      </div>
    </aside>
  )
}

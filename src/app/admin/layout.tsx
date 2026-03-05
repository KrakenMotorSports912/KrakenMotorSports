'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Trophy, Calendar, Tag, Users, LogOut, CalendarClock } from 'lucide-react'

type AuthUser = {
  app_metadata?: { provider?: string }
  user_metadata?: { provider?: string }
  identities?: Array<{ provider?: string }>
}

const hasDiscordIdentity = (user: AuthUser | null) => {
  if (!user) return false
  if (user.app_metadata?.provider === 'discord') return true
  if (user.user_metadata?.provider === 'discord') return true
  return (user.identities || []).some((identity) => identity.provider === 'discord')
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDiscordLinked, setIsDiscordLinked] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setIsDiscordLinked(hasDiscordIdentity(user as AuthUser))

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      router.push('/')
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kraken-dark flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { href: '/admin/events', icon: Calendar, label: 'Events' },
    { href: '/admin/bookings', icon: CalendarClock, label: 'Bookings' },
    { href: '/admin/discounts', icon: Tag, label: 'Discounts' },
    { href: '/admin/founders', icon: Users, label: 'Founders Pass' },
  ]

  return (
    <div className="min-h-screen bg-kraken-dark">
      {/* Admin Header */}
      <header className="bg-kraken-card border-b-2 border-kraken-cyan">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display tracking-wider text-kraken-cyan">
              🦑 ADMIN DASHBOARD
            </h1>
            <p className="text-gray-400 text-sm">Kraken Motorsports Management</p>
          </div>
          <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            {isDiscordLinked ? (
              <span className="text-xs sm:text-sm font-display tracking-wide px-3 py-2 border-2 text-center border-green-400 text-green-300 bg-green-500/10">
                DISCORD LINKED
              </span>
            ) : (
              <Link
                href="/login?link_discord=1"
                className="text-xs sm:text-sm font-display tracking-wide px-3 py-2 border-2 text-center border-yellow-400 text-yellow-300 bg-yellow-500/10 hover:border-kraken-cyan hover:text-kraken-cyan transition-colors"
              >
                DISCORD NOT LINKED
              </Link>
            )}
            <Link href="/" className="btn-secondary text-sm py-2 px-4 text-center">
              VIEW SITE
            </Link>
            <button 
              onClick={handleLogout}
              className="btn-secondary text-sm py-2 px-4 flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid gap-4 lg:gap-8 lg:grid-cols-[250px_1fr]">
          {/* Sidebar Navigation */}
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-kraken-cyan hover:bg-kraken-card border-2 border-transparent hover:border-kraken-cyan transition-all font-display"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Main Content */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

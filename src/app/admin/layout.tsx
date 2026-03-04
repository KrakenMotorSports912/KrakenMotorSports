'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Trophy, Calendar, Tag, Users, LogOut } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(false)
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
    { href: '/admin/discounts', icon: Tag, label: 'Discounts' },
    { href: '/admin/founders', icon: Users, label: 'Founders Pass' },
  ]

  return (
    <div className="min-h-screen bg-kraken-dark">
      {/* Admin Header */}
      <header className="bg-kraken-card border-b-2 border-kraken-cyan">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display tracking-wider text-kraken-cyan">
              🦑 ADMIN DASHBOARD
            </h1>
            <p className="text-gray-400 text-sm">Kraken Motorsports Management</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-secondary text-sm py-2 px-4">
              VIEW SITE
            </Link>
            <button 
              onClick={handleLogout}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <LogOut size={16} />
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-kraken-cyan hover:bg-kraken-card border-2 border-transparent hover:border-kraken-cyan transition-all font-display"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Main Content */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}

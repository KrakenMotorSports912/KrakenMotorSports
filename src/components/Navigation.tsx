'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const hasDiscordIdentity = (user: { app_metadata?: { provider?: string }; identities?: Array<{ provider?: string }>; user_metadata?: { provider?: string } } | null) => {
  if (!user) return false
  if (user.app_metadata?.provider === 'discord') return true
  if (user.user_metadata?.provider === 'discord') return true
  return (user.identities || []).some((identity) => identity.provider === 'discord')
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDiscordLinked, setIsDiscordLinked] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setIsAuthenticated(true)
      setIsDiscordLinked(hasDiscordIdentity(user))

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profile?.is_admin) {
        setIsAdmin(true)
      }

      return
    }

    setIsAuthenticated(false)
    setIsAdmin(false)
    setIsDiscordLinked(false)
  }

  const accountHref = isAuthenticated
    ? isAdmin
      ? '/admin'
      : isDiscordLinked
      ? '/submit'
      : '/profile'
    : '/login'

  const accountLabel = isAdmin
    ? 'ADMIN'
    : isAuthenticated
    ? isDiscordLinked
      ? 'SUBMIT'
      : 'ADD DISCORD'
    : 'LOG IN'

  const navLinks = [
    { href: '/about', label: 'The Rig' },
    { href: '/leaderboards', label: 'Leaderboards' },
    { href: '/events', label: 'Events' },
    { href: '/founders-pass', label: 'Founders Pass' },
  ]

  const bookingHref = '/bookings?from=home'

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || isOpen
          ? 'bg-kraken-dark/85 backdrop-blur-xl border-b border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="font-display text-2xl md:text-3xl text-kraken-cyan tracking-[0.25em] hover:text-glow transition-all">
            🦑 KRAKEN MS
          </Link>

          <div className="hidden xl:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-display text-sm tracking-[0.28em] text-white/85 hover:text-kraken-cyan transition-colors uppercase"
              >
                {link.label}
              </Link>
            ))}
            <Link href={bookingHref} className="btn-primary text-sm py-2 px-4">
              BOOK SESSION
            </Link>
            <Link href={accountHref} className="btn-secondary text-sm py-2 px-4">
              {accountLabel}
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden text-kraken-cyan"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isOpen && (
          <div className="xl:hidden py-4 space-y-4 border-t border-white/10 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block font-display text-lg tracking-[0.22em] text-white hover:text-kraken-cyan transition-colors py-2 uppercase"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={bookingHref}
              onClick={() => setIsOpen(false)}
              className="block btn-primary text-center"
            >
              BOOK SESSION
            </Link>
            <Link
              href={accountHref}
              onClick={() => setIsOpen(false)}
              className="block btn-secondary text-center mt-4"
            >
              {accountLabel}
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

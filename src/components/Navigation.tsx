'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
      
      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profile?.is_admin) {
        setIsAdmin(true)
      }
    }
  }

  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#leaderboard', label: 'Leaderboard' },
    { href: '#events', label: 'Events' },
    { href: '#founders', label: 'Founders Pass' },
    { href: '#contact', label: 'Contact' },
  ]

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled || isOpen
        ? 'bg-kraken-dark border-b-2 border-kraken-cyan'
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="font-display text-2xl md:text-3xl text-kraken-cyan tracking-wider hover:text-glow transition-all">
            🦑 KRAKEN MS
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-display text-lg tracking-wide text-white hover:text-kraken-cyan transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href={isAuthenticated ? "/admin" : "/login"} className="btn-secondary text-sm py-2 px-4">
              {isAdmin ? 'ADMIN' : 'LOG IN'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-kraken-cyan"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block font-display text-xl text-white hover:text-kraken-cyan transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={isAuthenticated ? "/admin" : "/login"}
              onClick={() => setIsOpen(false)}
              className="block btn-secondary text-center mt-4"
            >
              {isAdmin ? 'ADMIN' : 'LOG IN'}
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

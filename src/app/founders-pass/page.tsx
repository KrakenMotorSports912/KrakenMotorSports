'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PROFILE_PREFILL_KEY = 'kraken_profile_prefill_v1'
const BOOKING_PREFILL_KEY = 'kraken_booking_prefill_v1'
const FOUNDERS_PREFILL_KEY = 'kraken_founders_prefill_v1'

export default function FoundersPassPage() {
  const supabase = createClient()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [contact, setContact] = useState('')
  const [discord, setDiscord] = useState('')
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hydrateAutofill = async () => {
      try {
        const profileRaw = window.localStorage.getItem(PROFILE_PREFILL_KEY)
        if (profileRaw) {
          const profile = JSON.parse(profileRaw) as {
            fullName?: string
            firstName?: string
            lastName?: string
            contact?: string
            discord?: string
          }

          const derivedName =
            String(profile.fullName || '').trim() ||
            `${String(profile.firstName || '').trim()} ${String(profile.lastName || '').trim()}`.trim()

          setFullName((previous: string) => previous || derivedName)
          setContact((previous: string) => previous || String(profile.contact || ''))
          setDiscord((previous: string) => previous || String(profile.discord || ''))
        }

        const bookingRaw = window.localStorage.getItem(BOOKING_PREFILL_KEY)
        if (bookingRaw) {
          const booking = JSON.parse(bookingRaw) as {
            fullName?: string
            contact?: string
            email?: string
            discord?: string
          }

          setFullName((previous: string) => previous || String(booking.fullName || ''))
          setContact((previous: string) => previous || String(booking.contact || booking.email || ''))
          setDiscord((previous: string) => previous || String(booking.discord || ''))
        }

        const foundersRaw = window.localStorage.getItem(FOUNDERS_PREFILL_KEY)
        if (foundersRaw) {
          const founders = JSON.parse(foundersRaw) as {
            fullName?: string
            contact?: string
            discord?: string
          }

          setFullName((previous: string) => previous || String(founders.fullName || ''))
          setContact((previous: string) => previous || String(founders.contact || ''))
          setDiscord((previous: string) => previous || String(founders.discord || ''))
        }
      } catch {
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      if (!user) return

      const fallbackName =
        String(user.user_metadata?.full_name || '') ||
        String(user.user_metadata?.display_name || '') ||
        String(user.user_metadata?.name || '')

      const fallbackDiscord =
        String(user.user_metadata?.discord_username || '') ||
        String(user.user_metadata?.preferred_username || '')

      setContact((previous: string) => previous || String(user.email || user.phone || ''))
      setFullName((previous: string) => previous || fallbackName)
      setDiscord((previous: string) => previous || fallbackDiscord)
    }

    hydrateAutofill()
  }, [supabase])

  const resetForm = () => {
    setFullName('')
    setContact('')
    setDiscord('')
    setReason('')
    setSent(false)
    setError(null)
  }

  const handleCancel = () => {
    resetForm()

    const from = new URLSearchParams(window.location.search).get('from')
    if (from === 'home') {
      router.push('/#founders')
      return
    }

    router.push('/')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSent(false)

    const response = await fetch('/api/founders-pass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        contact,
        discord,
        reason,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (response.ok) {
      try {
        window.localStorage.setItem(
          FOUNDERS_PREFILL_KEY,
          JSON.stringify({
            fullName: fullName.trim(),
            contact: contact.trim(),
            discord: discord.trim(),
          })
        )
      } catch {
      }

      setSent(true)
      setFullName('')
      setContact('')
      setDiscord('')
      setReason('')
    } else {
      setError(payload.error || 'Unable to submit founders pass request right now.')
    }

    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-kraken-dark px-4 py-20">
      <div className="container mx-auto max-w-3xl">
        <h1 className="section-title">FOUNDERS PASS</h1>
        <p className="text-center text-gray-300 mb-10">Join the limited founders list (50 total) and lock your perks.</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <input
            className="input-field"
            placeholder="Full Name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          <input
            className="input-field"
            type="text"
            placeholder="Email or Phone"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            required
          />
          <input
            className="input-field"
            placeholder="Discord (optional)"
            value={discord}
            onChange={(event) => setDiscord(event.target.value)}
          />
          <textarea
            className="input-field"
            placeholder="Why you want to be a founder"
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          ></textarea>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'SUBMITTING...' : 'JOIN FOUNDERS LIST'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={submitting}>
              CANCEL
            </button>
          </div>

          {sent && <p className="text-kraken-cyan">You are on the interest list. We will contact you next.</p>}
          {error && <p className="text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  )
}

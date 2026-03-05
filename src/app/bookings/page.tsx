'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Slot = {
  id: string
  title: string | null
  start_time: string
  end_time: string
  is_open: boolean
  price_cents: number
  currency: string
  capacity: number
  booked_count: number
  remaining: number
  event_id?: string | null
}

const toInputDateValue = (date: Date) => date.toISOString().slice(0, 10)

const formatMoney = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format((Number(cents) || 0) / 100)

export default function BookingsPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(toInputDateValue(new Date()))
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [discord, setDiscord] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [eventFilter, setEventFilter] = useState('')

  useEffect(() => {
    const eventId = new URLSearchParams(window.location.search).get('event_id')
    if (eventId) {
      setEventFilter(eventId)
    }
  }, [])

  useEffect(() => {
    fetchSlots()
  }, [selectedDate, eventFilter])

  const fetchSlots = async () => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ date: selectedDate })
    if (eventFilter) params.set('event_id', eventFilter)

    const response = await fetch(`/api/public/booking-slots?${params.toString()}`)
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setSlots([])
      setError(payload.error || 'Unable to load booking slots right now.')
      setLoading(false)
      return
    }

    const nextSlots = (payload.slots || []) as Slot[]
    setSlots(nextSlots)
    if (!selectedSlotId && nextSlots.length > 0) {
      setSelectedSlotId(nextSlots[0].id)
    }
    setLoading(false)
  }

  const selectedSlot = useMemo(() => slots.find((slot) => slot.id === selectedSlotId) || null, [slots, selectedSlotId])

  const quickCalendarDates = useMemo(() => {
    const base = new Date()
    return Array.from({ length: 14 }).map((_, index) => {
      const day = new Date(base)
      day.setDate(base.getDate() + index)
      return {
        key: toInputDateValue(day),
        label: day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      }
    })
  }, [])

  const handleCancel = () => {
    setSelectedSlotId('')
    setFullName('')
    setEmail('')
    setDiscord('')
    setNotes('')
    setMessage('')
    setError('')

    const from = new URLSearchParams(window.location.search).get('from')
    if (from === 'home') {
      router.push('/#events')
      return
    }

    router.push('/')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: selectedSlotId,
        fullName,
        email,
        discord,
        notes,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(payload.error || 'Unable to complete booking.')
      setSubmitting(false)
      return
    }

    setMessage('Booking request submitted. We will confirm your time shortly.')
    setFullName('')
    setEmail('')
    setDiscord('')
    setNotes('')
    setSubmitting(false)
    fetchSlots()
  }

  return (
    <main className="min-h-screen bg-kraken-dark px-4 py-20">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="section-title">BOOK A SIM TIME</h1>
          <p className="text-center text-gray-300">Pick a day and reserve an available simulator slot.</p>
        </div>

        <div className="card grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="block text-sm font-display tracking-wide text-kraken-cyan mb-2">QUICK CALENDAR</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickCalendarDates.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDate(day.key)}
                    className={`border-2 px-3 py-2 text-xs sm:text-sm font-display transition-colors ${
                      selectedDate === day.key
                        ? 'border-kraken-cyan text-kraken-cyan bg-kraken-card'
                        : 'border-gray-700 text-gray-300 hover:border-kraken-cyan/60'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm font-display tracking-wide text-kraken-cyan">DATE</label>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSelectedDate(event.target.value)}
              min={toInputDateValue(new Date())}
            />

            {loading ? (
              <p className="text-gray-400">Loading slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-gray-400">No available slots for this date.</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const start = new Date(slot.start_time)
                  const end = new Date(slot.end_time)
                  const disabled = slot.remaining <= 0

                  return (
                    <label
                      key={slot.id}
                      className={`block border-2 p-3 cursor-pointer transition-colors ${
                        selectedSlotId === slot.id ? 'border-kraken-cyan bg-kraken-card' : 'border-gray-700 bg-kraken-dark'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-kraken-cyan/60'}`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        className="sr-only"
                        value={slot.id}
                        checked={selectedSlotId === slot.id}
                        onChange={() => setSelectedSlotId(slot.id)}
                        disabled={disabled}
                      />
                      <p className="font-display text-kraken-cyan">{start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                      <p className="text-sm text-gray-300">{slot.title || 'Simulator Session'} • {formatMoney(slot.price_cents, slot.currency)}</p>
                      <p className="text-xs text-gray-400">{slot.remaining} of {slot.capacity} spots left</p>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-display tracking-wide text-kraken-cyan">RESERVE SLOT</h2>
            {selectedSlot && (
              <p className="text-sm text-gray-300">
                Selected: {new Date(selectedSlot.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} • {formatMoney(selectedSlot.price_cents, selectedSlot.currency)}
              </p>
            )}

            <input className="input-field" placeholder="Full Name" value={fullName} onChange={(event: ChangeEvent<HTMLInputElement>) => setFullName(event.target.value)} required />
            <input className="input-field" placeholder="Email" type="email" value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} required />
            <input className="input-field" placeholder="Discord (optional)" value={discord} onChange={(event: ChangeEvent<HTMLInputElement>) => setDiscord(event.target.value)} />
            <textarea className="input-field" rows={3} placeholder="Notes (optional)" value={notes} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)} />

            <button type="submit" className="btn-primary w-full justify-center inline-flex" disabled={submitting || !selectedSlotId}>
              {submitting ? 'SUBMITTING...' : 'REQUEST BOOKING'}
            </button>

            <button type="button" className="btn-secondary w-full justify-center inline-flex" onClick={handleCancel} disabled={submitting}>
              CANCEL
            </button>

            {message && <p className="text-kraken-cyan text-sm">{message}</p>}
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </form>
        </div>
      </div>
    </main>
  )
}

'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

const toInputDateValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const expandEventDateRange = (startDateRaw?: string, endDateRaw?: string) => {
  const startKey = String(startDateRaw || '').slice(0, 10)
  const endKey = String(endDateRaw || startDateRaw || '').slice(0, 10)
  if (!startKey) return [] as string[]

  const start = new Date(`${startKey}T00:00:00.000Z`)
  const end = new Date(`${endKey}T00:00:00.000Z`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [startKey]
  }

  const keys: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return keys
}

const formatMoney = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format((Number(cents) || 0) / 100)

const BOOKING_PREFILL_KEY = 'kraken_booking_prefill_v1'
const PROFILE_PREFILL_KEY = 'kraken_profile_prefill_v1'

export default function BookingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(toInputDateValue(new Date()))
  const [calendarMonth, setCalendarMonth] = useState(toInputDateValue(new Date()).slice(0, 7))
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [fullName, setFullName] = useState('')
  const [contact, setContact] = useState('')
  const [discord, setDiscord] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [eventDateKeys, setEventDateKeys] = useState<string[]>([])
  const [calendarDayStates, setCalendarDayStates] = useState<Record<string, 'open' | 'full'>>({})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')

    if (payment === 'success') {
      setMessage('Payment confirmed. Your reservation is now confirmed.')
      setError('')
    }

    if (payment === 'cancelled') {
      setError('Payment was cancelled. You can try again below.')
      setMessage('')
    }
  }, [])

  useEffect(() => {
    const hydratePrefillData = async () => {
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

        const storedRaw = window.localStorage.getItem(BOOKING_PREFILL_KEY)
        if (storedRaw) {
          const stored = JSON.parse(storedRaw) as {
            fullName?: string
            contact?: string
            email?: string
            discord?: string
          }

          setFullName((previous: string) => previous || String(stored.fullName || ''))
          setContact((previous: string) => previous || String(stored.contact || stored.email || ''))
          setDiscord((previous: string) => previous || String(stored.discord || ''))
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      const profileDisplayName = String(profile?.display_name || '')

      setContact((previous: string) => previous || String(user.email || ''))
      setFullName((previous: string) => previous || profileDisplayName || fallbackName)
      setDiscord((previous: string) => previous || fallbackDiscord)
    }

    hydratePrefillData()
  }, [supabase])

  useEffect(() => {
    const eventId = new URLSearchParams(window.location.search).get('event_id')
    if (eventId) {
      setEventFilter(eventId)
    }
  }, [])

  useEffect(() => {
    fetchSlots()
  }, [selectedDate, eventFilter])

  useEffect(() => {
    setCalendarMonth(selectedDate.slice(0, 7))
  }, [selectedDate])

  useEffect(() => {
    const fetchEventDates = async () => {
      const response = await fetch('/api/public/events?limit=50')
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) return

      const nextDates = Array.from(
        new Set(
          ((payload.events || []) as Array<{ start_date?: string; end_date?: string }>)
            .flatMap((eventItem) => expandEventDateRange(eventItem.start_date, eventItem.end_date))
        )
      )

      setEventDateKeys(nextDates)
    }

    fetchEventDates()
  }, [])

  useEffect(() => {
    const fetchCalendarAvailability = async () => {
      const params = new URLSearchParams({ month: calendarMonth })
      if (eventFilter) params.set('event_id', eventFilter)

      const response = await fetch(`/api/public/booking-slots?${params.toString()}`)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setCalendarDayStates({})
        return
      }

      const nextStates: Record<string, 'open' | 'full'> = {}
      const days = (payload.calendarDays || {}) as Record<string, { totalSlots: number; openSlots: number }>
      Object.entries(days).forEach(([dayKey, value]) => {
        if (Number(value?.totalSlots || 0) <= 0) return
        nextStates[dayKey] = Number(value?.openSlots || 0) > 0 ? 'open' : 'full'
      })
      setCalendarDayStates(nextStates)
    }

    fetchCalendarAvailability()
  }, [calendarMonth, eventFilter])

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

  const monthCalendar = useMemo(() => {
    const [yearRaw, monthRaw] = calendarMonth.split('-')
    const year = Number(yearRaw)
    const month = Number(monthRaw)
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return { monthLabel: '', cells: [] as Array<{ key: string; dayLabel: string; inMonth: boolean }> }
    }

    const firstDay = new Date(year, month - 1, 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstWeekday = firstDay.getDay()
    const cells: Array<{ key: string; dayLabel: string; inMonth: boolean }> = []

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({ key: `empty-${i}`, dayLabel: '', inMonth: false })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        dayLabel: String(day),
        inMonth: true,
      })
    }

    return {
      monthLabel: firstDay.toLocaleDateString([], { month: 'long', year: 'numeric' }),
      cells,
    }
  }, [calendarMonth])

  const shiftMonth = (delta: number) => {
    const [yearRaw, monthRaw] = calendarMonth.split('-')
    const year = Number(yearRaw)
    const month = Number(monthRaw)
    const next = new Date(year, month - 1 + delta, 1)
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    setCalendarMonth(nextMonth)
  }

  const handleFinish = () => {
    setSelectedSlotId('')
    setFullName('')
    setContact('')
    setDiscord('')
    setNotes('')
    setMessage('')
    setError('')

    router.push('/', { scroll: true })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const accessToken = session?.access_token || null

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        slotId: selectedSlotId,
        fullName,
        contact,
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

    try {
      window.localStorage.setItem(
        BOOKING_PREFILL_KEY,
        JSON.stringify({
          fullName: fullName.trim(),
          contact: contact.trim(),
          discord: discord.trim(),
        })
      )
    } catch {
    }

    try {
      if (payload?.id) {
        window.localStorage.setItem(
          'kraken_pending_payment_booking',
          JSON.stringify({
            reservationId: payload.id,
            paymentReady: Boolean(payload?.next?.paymentReady),
            paymentPath: String(payload?.next?.paymentPath || '/payment'),
          })
        )
      }
    } catch {
    }

    const reservationId = String(payload?.id || '')
    const paymentReady = Boolean(payload?.next?.paymentReady)

    if (reservationId && paymentReady) {
      const paymentResponse = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ reservationId }),
      })

      const paymentPayload = await paymentResponse.json().catch(() => ({}))

      if (paymentResponse.ok && paymentPayload.checkoutUrl) {
        window.location.href = String(paymentPayload.checkoutUrl)
        return
      }

      setError(paymentPayload.error || 'Reservation was created, but payment could not start. Please try again.')
      setSubmitting(false)
      fetchSlots()
      return
    }

    setMessage('Booking request submitted. Payment is not configured yet, so your reservation stays pending.')
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
              <div className="flex items-center justify-between mb-2">
                <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => shiftMonth(-1)}>
                  PREV
                </button>
                <p className="text-sm text-gray-300">{monthCalendar.monthLabel}</p>
                <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => shiftMonth(1)}>
                  NEXT
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-[11px] text-gray-500 mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((name) => (
                  <p key={name} className="text-center">{name}</p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthCalendar.cells.map((day) => {
                  if (!day.inMonth) {
                    return <div key={day.key} className="h-10" />
                  }

                  const hasEvent = eventDateKeys.includes(day.key)
                  const slotState = calendarDayStates[day.key]
                  const isPast = day.key < toInputDateValue(new Date())
                  const isSelected = selectedDate === day.key
                  const baseClass = 'h-10 border-2 text-xs sm:text-sm font-display transition-colors'

                  let dayClass = 'border-gray-700 text-gray-300'
                  if (hasEvent) {
                    dayClass = 'border-kraken-pink text-kraken-pink bg-kraken-card ring-1 ring-kraken-pink/70'
                  } else if (slotState === 'full') {
                    dayClass = 'border-red-500 text-red-400 bg-kraken-card ring-1 ring-red-500/60'
                  } else if (slotState === 'open') {
                    dayClass = 'border-kraken-cyan text-kraken-cyan bg-kraken-card ring-1 ring-kraken-cyan/60'
                  }

                  if (isSelected) {
                    dayClass = 'border-kraken-cyan bg-kraken-cyan text-black'
                  }

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setSelectedDate(day.key)}
                      disabled={isPast}
                      className={`${baseClass} ${dayClass} ${isPast ? 'opacity-35 cursor-not-allowed' : 'hover:border-kraken-cyan/60'}`}
                    >
                      {day.dayLabel}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">Cyan glow = open slots, red glow = full, pink/purple glow = event day.</p>
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
            <input className="input-field" placeholder="Email or Phone" type="text" value={contact} onChange={(event: ChangeEvent<HTMLInputElement>) => setContact(event.target.value)} required />
            <input className="input-field" placeholder="Discord (optional)" value={discord} onChange={(event: ChangeEvent<HTMLInputElement>) => setDiscord(event.target.value)} />
            <textarea className="input-field" rows={3} placeholder="Notes (optional)" value={notes} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)} />

            <button type="submit" className="btn-primary w-full justify-center inline-flex" disabled={submitting || !selectedSlotId}>
              {submitting ? 'PROCESSING...' : 'RESERVE & PAY'}
            </button>

            <button type="button" className="btn-secondary w-full justify-center inline-flex" onClick={handleFinish} disabled={submitting}>
              FINISH
            </button>

            {message && <p className="text-kraken-cyan text-sm">{message}</p>}
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </form>
        </div>
      </div>
    </main>
  )
}

'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
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
}

type Reservation = {
  id: string
  slot_id: string
  full_name: string
  email: string
  discord: string | null
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  cancel_reason: string | null
  created_at: string
  booking_slots?: {
    start_time: string
    end_time: string
    title: string | null
    price_cents: number
    currency: string
    capacity: number
    booked_count: number
  } | null
}

const toInputDateValue = (date: Date) => date.toISOString().slice(0, 10)

export default function AdminBookingsPage() {
  const supabase = createClient()
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedDate, setSelectedDate] = useState(toInputDateValue(new Date()))
  const [slotDayMode, setSlotDayMode] = useState<'selected' | 'all'>('selected')
  const [slotTimeFrom, setSlotTimeFrom] = useState('')
  const [slotTimeTo, setSlotTimeTo] = useState('')
  const [slotSortOrder, setSlotSortOrder] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all')
  const [settings, setSettings] = useState({
    openHour: '10',
    closeHour: '22',
    slotMinutes: '30',
    defaultPriceCents: '2500',
    currency: 'USD',
    defaultCapacity: '1',
  })

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('You must be logged in as admin to manage bookings.')
        setLoading(false)
        return
      }

      setAccessToken(session.access_token)
      await Promise.all([
        fetchSettings(session.access_token),
        fetchSlots(session.access_token, selectedDate, slotDayMode),
        fetchReservations(session.access_token, statusFilter),
      ])
      setLoading(false)
    }

    init()
  }, [])

  const fetchSettings = async (token = accessToken) => {
    const response = await fetch('/api/admin/bookings/settings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(payload.error || 'Unable to load booking settings.')
      return
    }

    const next = payload.settings || {}
    setSettings((previous) => ({
      ...previous,
      openHour: next.booking_open_hour || previous.openHour,
      closeHour: next.booking_close_hour || previous.closeHour,
      slotMinutes: next.booking_slot_minutes || previous.slotMinutes,
      defaultPriceCents: next.booking_default_price_cents || previous.defaultPriceCents,
      currency: next.booking_currency || previous.currency,
      defaultCapacity: next.booking_default_capacity || previous.defaultCapacity,
    }))
  }

  const fetchSlots = async (token = accessToken, date = selectedDate, dayMode: 'selected' | 'all' = slotDayMode) => {
    const query = dayMode === 'selected' ? `?date=${encodeURIComponent(date)}` : ''
    const response = await fetch(`/api/admin/bookings/slots${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(payload.error || 'Unable to load slots.')
      return
    }

    setSlots((payload.slots || []) as Slot[])
  }

  useEffect(() => {
    if (!accessToken) return
    fetchSlots(accessToken, selectedDate, slotDayMode)
  }, [accessToken, selectedDate, slotDayMode])

  const fetchReservations = async (token = accessToken, status = statusFilter) => {
    const response = await fetch(`/api/admin/bookings/reservations?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(payload.error || 'Unable to load reservations.')
      return
    }

    setReservations((payload.reservations || []) as Reservation[])
  }

  const handleSaveSettings = async () => {
    setMessage('')
    setError('')

    const response = await fetch('/api/admin/bookings/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(settings),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || 'Unable to save booking settings.')
      return
    }

    setMessage('Booking settings saved.')
  }

  const handleGenerateSlots = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const response = await fetch('/api/admin/bookings/slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        date: selectedDate,
        openHour: Number(settings.openHour),
        closeHour: Number(settings.closeHour),
        slotMinutes: Number(settings.slotMinutes),
        priceCents: Number(settings.defaultPriceCents),
        currency: settings.currency,
        capacity: Number(settings.defaultCapacity),
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || 'Unable to generate slots.')
      return
    }

    setMessage(`Generated ${payload.created || 0} slots.`)
    fetchSlots(accessToken, selectedDate, slotDayMode)
  }

  const handleToggleSlotOpen = async (slot: Slot) => {
    const response = await fetch(`/api/admin/bookings/slots/${slot.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ is_open: !slot.is_open }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || 'Unable to update slot.')
      return
    }

    fetchSlots(accessToken, selectedDate, slotDayMode)
  }

  const handleDeleteSlot = async (slot: Slot) => {
    const confirmed = confirm('Delete this slot? You can only delete slots without active reservations.')
    if (!confirmed) return

    const response = await fetch(`/api/admin/bookings/slots/${slot.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || 'Unable to delete slot.')
      return
    }

    fetchSlots(accessToken, selectedDate, slotDayMode)
  }

  const updateReservationStatus = async (reservationId: string, status: Reservation['status']) => {
    const response = await fetch(`/api/admin/bookings/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || 'Unable to update reservation status.')
      return
    }

    fetchReservations(accessToken, statusFilter)
    fetchSlots(accessToken, selectedDate, slotDayMode)
  }

  const reservationsSummary = useMemo(() => {
    const pending = reservations.filter((item) => item.status === 'pending').length
    const confirmed = reservations.filter((item) => item.status === 'confirmed').length
    return { pending, confirmed }
  }, [reservations])

  const filteredSlots = useMemo(() => {
    const timeToMinutes = (value: string) => {
      const [hoursRaw, minutesRaw] = value.split(':')
      const hours = Number(hoursRaw)
      const minutes = Number(minutesRaw)
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
      return hours * 60 + minutes
    }

    const fromMinutes = slotTimeFrom ? timeToMinutes(slotTimeFrom) : null
    const toMinutes = slotTimeTo ? timeToMinutes(slotTimeTo) : null

    return slots.filter((slot) => {
      if (slotDayMode === 'selected' && slot.start_time.slice(0, 10) !== selectedDate) {
        return false
      }

      if (fromMinutes === null && toMinutes === null) {
        return true
      }

      const start = new Date(slot.start_time)
      const slotMinutes = start.getHours() * 60 + start.getMinutes()

      if (fromMinutes !== null && slotMinutes < fromMinutes) return false
      if (toMinutes !== null && slotMinutes > toMinutes) return false
      return true
    })
  }, [slots, slotDayMode, selectedDate, slotTimeFrom, slotTimeTo])

  const sortedSlots = useMemo(() => {
    const direction = slotSortOrder === 'asc' ? 1 : -1
    return [...filteredSlots].sort((left, right) => {
      const leftTs = new Date(left.start_time).getTime()
      const rightTs = new Date(right.start_time).getTime()
      return (leftTs - rightTs) * direction
    })
  }, [filteredSlots, slotSortOrder])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl sm:text-4xl font-display tracking-wider text-kraken-cyan mb-2">BOOKINGS & CALENDAR</h2>
        <p className="text-gray-400">Configure open hours, pricing, and monitor reservations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card"><p className="text-gray-400 text-sm">PENDING</p><p className="text-3xl font-display text-kraken-cyan">{reservationsSummary.pending}</p></div>
        <div className="card"><p className="text-gray-400 text-sm">CONFIRMED</p><p className="text-3xl font-display text-kraken-cyan">{reservationsSummary.confirmed}</p></div>
        <div className="card"><p className="text-gray-400 text-sm">SLOTS ({selectedDate})</p><p className="text-3xl font-display text-kraken-cyan">{slots.length}</p></div>
      </div>

      <div className="card space-y-4">
        <h3 className="text-xl font-display text-kraken-cyan">OPEN HOURS & PRICING</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 block">
            <span className="text-xs text-gray-400">OPEN HOUR (24H)</span>
            <input className="input-field" type="number" min={0} max={23} value={settings.openHour} onChange={(event) => setSettings((prev) => ({ ...prev, openHour: event.target.value }))} placeholder="Open hour (0-23)" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-gray-400">CLOSE HOUR (24H)</span>
            <input className="input-field" type="number" min={1} max={24} value={settings.closeHour} onChange={(event) => setSettings((prev) => ({ ...prev, closeHour: event.target.value }))} placeholder="Close hour (1-24)" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-gray-400">SLOT LENGTH (MINUTES)</span>
            <input className="input-field" type="number" min={10} max={180} value={settings.slotMinutes} onChange={(event) => setSettings((prev) => ({ ...prev, slotMinutes: event.target.value }))} placeholder="Slot minutes" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-gray-400">DEFAULT PRICE (CENTS)</span>
            <input className="input-field" type="number" min={0} value={settings.defaultPriceCents} onChange={(event) => setSettings((prev) => ({ ...prev, defaultPriceCents: event.target.value }))} placeholder="Price cents" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-gray-400">CURRENCY</span>
            <input className="input-field" value={settings.currency} onChange={(event) => setSettings((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} placeholder="Currency" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-gray-400">CAPACITY PER SLOT</span>
            <input className="input-field" type="number" min={1} value={settings.defaultCapacity} onChange={(event) => setSettings((prev) => ({ ...prev, defaultCapacity: event.target.value }))} placeholder="Capacity per slot" />
          </label>
        </div>
        <button className="btn-secondary" onClick={handleSaveSettings}>SAVE SETTINGS</button>
      </div>

      <form onSubmit={handleGenerateSlots} className="card space-y-4">
        <h3 className="text-xl font-display text-kraken-cyan">GENERATE DAILY SLOTS</h3>
        <label className="space-y-1 block max-w-xs">
          <span className="text-xs text-gray-400">SLOT DATE</span>
          <input type="date" className="input-field" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <div className="flex gap-3 flex-wrap">
          <button type="submit" className="btn-primary">GENERATE SLOTS</button>
          <button type="button" className="btn-secondary" onClick={() => fetchSlots(accessToken, selectedDate)}>REFRESH SLOTS</button>
          <button type="button" className="btn-secondary" onClick={() => fetchReservations(accessToken, statusFilter)}>REFRESH RESERVATIONS</button>
        </div>
      </form>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-display text-kraken-cyan">SLOTS ({slotDayMode === 'selected' ? selectedDate : 'ALL UPCOMING'})</h3>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="space-y-1 block">
              <span className="text-xs text-gray-400">DAY RANGE</span>
              <select
                className="input-field min-w-[150px]"
                value={slotDayMode}
                onChange={(event) => setSlotDayMode(event.target.value as 'selected' | 'all')}
              >
                <option value="selected">Selected Day</option>
                <option value="all">All Upcoming</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-xs text-gray-400">FROM</span>
              <input type="time" className="input-field" value={slotTimeFrom} onChange={(event) => setSlotTimeFrom(event.target.value)} />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs text-gray-400">TO</span>
              <input type="time" className="input-field" value={slotTimeTo} onChange={(event) => setSlotTimeTo(event.target.value)} />
            </label>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSlotSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'))}
            >
              SORT: {slotSortOrder === 'asc' ? 'EARLIEST FIRST' : 'LATEST FIRST'}
            </button>
          </div>
        </div>
        {sortedSlots.length === 0 ? (
          <p className="text-gray-400">No slots created for this date yet.</p>
        ) : (
          <div className="space-y-2">
            {sortedSlots.map((slot) => (
              <div key={slot.id} className="border border-gray-700 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-display text-kraken-cyan">{new Date(slot.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                  <p className="text-sm text-gray-300">{slot.title || 'Simulator Session'} • {slot.booked_count}/{slot.capacity} booked • {(slot.price_cents / 100).toFixed(2)} {slot.currency}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn-secondary" onClick={() => handleToggleSlotOpen(slot)}>{slot.is_open ? 'CLOSE SLOT' : 'OPEN SLOT'}</button>
                  <button className="btn-secondary" onClick={() => handleDeleteSlot(slot)}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-display text-kraken-cyan">RESERVATIONS</h3>
          <label className="space-y-1 block w-full sm:w-auto">
            <span className="text-xs text-gray-400">FILTER BY STATUS</span>
            <select className="input-field max-w-[220px]" value={statusFilter} onChange={(event) => { const next = event.target.value as typeof statusFilter; setStatusFilter(next); fetchReservations(accessToken, next) }}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>

        {reservations.length === 0 ? (
          <p className="text-gray-400">No reservations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Contact</th>
                  <th className="py-3 px-4 text-left">Slot</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="table-row">
                    <td className="py-3 px-4">{reservation.full_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{reservation.email}{reservation.discord ? ` • ${reservation.discord}` : ''}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {reservation.booking_slots
                        ? `${new Date(reservation.booking_slots.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                        : 'Unknown slot'}
                    </td>
                    <td className="py-3 px-4">{reservation.status.toUpperCase()}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="btn-secondary text-xs py-1 px-2" onClick={() => updateReservationStatus(reservation.id, 'confirmed')}>CONFIRM</button>
                        <button className="btn-secondary text-xs py-1 px-2" onClick={() => updateReservationStatus(reservation.id, 'completed')}>COMPLETE</button>
                        <button className="btn-secondary text-xs py-1 px-2" onClick={() => updateReservationStatus(reservation.id, 'cancelled')}>CANCEL</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {message && <p className="text-sm text-kraken-cyan">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}

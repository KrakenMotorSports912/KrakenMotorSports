import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isMissingBookingTables } from '@/lib/serverBooking'

export async function GET(request: NextRequest) {
  try {
    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const month = url.searchParams.get('month')
    const eventId = url.searchParams.get('event_id')

    if (month) {
      const [yearRaw, monthRaw] = month.split('-')
      const year = Number(yearRaw)
      const monthValue = Number(monthRaw)

      if (!Number.isFinite(year) || !Number.isFinite(monthValue) || monthValue < 1 || monthValue > 12) {
        return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM.' }, { status: 400 })
      }

      const rangeStart = new Date(Date.UTC(year, monthValue - 1, 1, 0, 0, 0, 0))
      const rangeEnd = new Date(Date.UTC(year, monthValue, 1, 0, 0, 0, 0))

      let monthQuery = serviceClient
        .from('booking_slots')
        .select('start_time,end_time,is_open,capacity,booked_count,event_id')
        .gte('start_time', rangeStart.toISOString())
        .lt('start_time', rangeEnd.toISOString())
        .order('start_time', { ascending: true })
        .limit(1000)

      if (eventId) {
        monthQuery = monthQuery.eq('event_id', eventId)
      }

      const { data: monthData, error: monthError } = await monthQuery

      if (monthError) {
        if (isMissingBookingTables(monthError.message)) {
          return NextResponse.json(
            { error: 'Booking system is not initialized yet. Please run booking SQL setup.' },
            { status: 503 }
          )
        }
        return NextResponse.json({ error: monthError.message }, { status: 500 })
      }

      const nowTs = Date.now()
      const summary = new Map<string, { totalSlots: number; openSlots: number }>()

      for (const slot of monthData || []) {
        const dayKey = String(slot.start_time || '').slice(0, 10)
        if (!dayKey) continue

        const current = summary.get(dayKey) || { totalSlots: 0, openSlots: 0 }
        current.totalSlots += 1

        const capacity = Number(slot.capacity || 0)
        const booked = Number(slot.booked_count || 0)
        const hasRemaining = capacity > booked
        const inFuture = new Date(String(slot.end_time || slot.start_time)).getTime() > nowTs

        if (Boolean(slot.is_open) && hasRemaining && inFuture) {
          current.openSlots += 1
        }

        summary.set(dayKey, current)
      }

      const calendarDays = Array.from(summary.entries()).reduce<Record<string, { totalSlots: number; openSlots: number }>>(
        (acc, [dayKey, values]) => {
          acc[dayKey] = values
          return acc
        },
        {}
      )

      return NextResponse.json({ calendarDays })
    }

    let query = serviceClient
      .from('booking_slots')
      .select('id,title,start_time,end_time,is_open,price_cents,currency,capacity,booked_count,event_id')
      .eq('is_open', true)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(200)

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`)
      const end = new Date(`${date}T23:59:59.999Z`)
      query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString())
    }

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data, error } = await query

    if (error) {
      if (isMissingBookingTables(error.message)) {
        return NextResponse.json(
          { error: 'Booking system is not initialized yet. Please run booking SQL setup.' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const slots = (data || []).map((slot: { capacity: number | null; booked_count: number | null }) => ({
      ...slot,
      remaining: Math.max(0, Number(slot.capacity || 0) - Number(slot.booked_count || 0)),
    }))

    return NextResponse.json({ slots })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}

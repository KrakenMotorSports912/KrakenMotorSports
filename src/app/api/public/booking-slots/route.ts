import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isMissingBookingTables } from '@/lib/serverBooking'

export async function GET(request: NextRequest) {
  try {
    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const eventId = url.searchParams.get('event_id')

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

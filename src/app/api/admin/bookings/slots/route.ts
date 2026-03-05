import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, isMissingBookingTables } from '@/lib/serverBooking'

const toIsoAtHour = (dateString: string, hour: number, minute = 0) => {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCHours(hour, minute, 0, 0)
  return date
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const url = new URL(request.url)
  const date = url.searchParams.get('date')

  let query = auth.serviceClient
    .from('booking_slots')
    .select('*')
    .order('start_time', { ascending: true })
    .limit(500)

  if (date) {
    const start = toIsoAtHour(date, 0)
    const end = toIsoAtHour(date, 23, 59)
    query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString())
  } else {
    query = query.gte('start_time', new Date().toISOString())
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

  return NextResponse.json({ slots: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const date = String(body?.date || '').trim()
  const openHour = Number(body?.openHour)
  const closeHour = Number(body?.closeHour)
  const slotMinutes = Number(body?.slotMinutes)
  const priceCents = Number(body?.priceCents)
  const capacity = Number(body?.capacity)
  const currency = String(body?.currency || 'USD').trim().toUpperCase()
  const titlePrefix = String(body?.titlePrefix || 'Simulator Session').trim()

  if (!date || Number.isNaN(openHour) || Number.isNaN(closeHour) || Number.isNaN(slotMinutes)) {
    return NextResponse.json({ error: 'Missing required scheduling fields.' }, { status: 400 })
  }

  if (closeHour <= openHour) {
    return NextResponse.json({ error: 'Close hour must be after open hour.' }, { status: 400 })
  }

  if (slotMinutes < 10 || slotMinutes > 180) {
    return NextResponse.json({ error: 'Slot length must be between 10 and 180 minutes.' }, { status: 400 })
  }

  const start = toIsoAtHour(date, openHour)
  const end = toIsoAtHour(date, closeHour)

  const slotsToInsert: Record<string, unknown>[] = []
  let cursor = new Date(start)

  while (cursor.getTime() + slotMinutes * 60000 <= end.getTime()) {
    const slotStart = new Date(cursor)
    const slotEnd = new Date(cursor.getTime() + slotMinutes * 60000)
    slotsToInsert.push({
      title: `${titlePrefix}`,
      start_time: slotStart.toISOString(),
      end_time: slotEnd.toISOString(),
      is_open: true,
      price_cents: Number.isFinite(priceCents) ? priceCents : 0,
      currency,
      capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 1,
      booked_count: 0,
      created_by: auth.user.id,
    })
    cursor = slotEnd
  }

  if (slotsToInsert.length === 0) {
    return NextResponse.json({ error: 'No slots were generated for that range.' }, { status: 400 })
  }

  const { data, error } = await auth.serviceClient.from('booking_slots').insert(slotsToInsert).select('id')

  if (error) {
    if (isMissingBookingTables(error.message)) {
      return NextResponse.json(
        { error: 'Booking system is not initialized yet. Please run booking SQL setup.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, created: data?.length || 0 })
}

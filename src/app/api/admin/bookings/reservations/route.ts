import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, isMissingBookingTables } from '@/lib/serverBooking'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'all'

  let query = auth.serviceClient
    .from('booking_reservations')
    .select('id,slot_id,full_name,email,discord,notes,is_paid,status,cancel_reason,created_at,updated_at,booking_slots(start_time,end_time,title,price_cents,currency,capacity,booked_count)')
    .order('created_at', { ascending: false })
    .limit(500)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  let { data, error } = await query

  if (error && error.message.includes("Could not find the 'is_paid' column")) {
    let fallbackQuery = auth.serviceClient
      .from('booking_reservations')
      .select('id,slot_id,full_name,email,discord,notes,status,cancel_reason,created_at,updated_at,booking_slots(start_time,end_time,title,price_cents,currency,capacity,booked_count)')
      .order('created_at', { ascending: false })
      .limit(500)

    if (status !== 'all') {
      fallbackQuery = fallbackQuery.eq('status', status)
    }

    const fallbackResult = await fallbackQuery
    data = (fallbackResult.data || []).map((item: any) => ({
      ...item,
      is_paid: item.status === 'completed',
    }))
    error = fallbackResult.error
  }

  if (error) {
    if (isMissingBookingTables(error.message)) {
      return NextResponse.json(
        { error: 'Booking system is not initialized yet. Please run booking SQL setup.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reservations: data || [] })
}

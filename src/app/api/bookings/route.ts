import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isMissingBookingTables } from '@/lib/serverBooking'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const slotId = (body?.slotId || '').trim()
    const fullName = (body?.fullName || '').trim()
    const email = (body?.email || '').trim()
    const discord = (body?.discord || '').trim()
    const notes = (body?.notes || '').trim()

    if (!slotId || !fullName || !email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    const { data: slot, error: slotError } = await serviceClient
      .from('booking_slots')
      .select('id,start_time,is_open,capacity,booked_count')
      .eq('id', slotId)
      .maybeSingle()

    if (slotError) {
      if (isMissingBookingTables(slotError.message)) {
        return NextResponse.json(
          { error: 'Booking system is not initialized yet. Please run booking SQL setup.' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: slotError.message }, { status: 500 })
    }

    if (!slot) {
      return NextResponse.json({ error: 'Selected time slot was not found.' }, { status: 404 })
    }

    if (!slot.is_open) {
      return NextResponse.json({ error: 'This time slot is closed.' }, { status: 400 })
    }

    if (new Date(slot.start_time).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'This time slot has already started.' }, { status: 400 })
    }

    const capacity = Number(slot.capacity || 0)
    const bookedCount = Number(slot.booked_count || 0)
    if (capacity > 0 && bookedCount >= capacity) {
      return NextResponse.json({ error: 'This time slot is full.' }, { status: 409 })
    }

    const { data: inserted, error: insertError } = await serviceClient
      .from('booking_reservations')
      .insert({
        slot_id: slotId,
        full_name: fullName,
        email,
        discord: discord || null,
        notes: notes || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { error: countError } = await serviceClient
      .from('booking_slots')
      .update({ booked_count: bookedCount + 1 })
      .eq('id', slotId)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: inserted.id, status: 'pending' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}

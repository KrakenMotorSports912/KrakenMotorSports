import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/serverBooking'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params
  const body = await request.json().catch(() => null)
  const nextStatus = String(body?.status || '').trim()
  const nextIsPaid = typeof body?.is_paid === 'boolean' ? body.is_paid : null
  const cancelReason = String(body?.cancel_reason || '').trim()

  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid reservation status.' }, { status: 400 })
  }

  const { data: existing, error: fetchError } = await auth.serviceClient
    .from('booking_reservations')
    .select('id,slot_id,status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {
    status: nextStatus,
    cancel_reason: nextStatus === 'cancelled' ? cancelReason || null : null,
    updated_at: new Date().toISOString(),
  }

  if (nextIsPaid !== null) {
    updates.is_paid = nextIsPaid
  } else if (nextStatus === 'completed') {
    updates.is_paid = true
  } else if (nextStatus === 'cancelled') {
    updates.is_paid = false
  }

  const { data, error } = await auth.serviceClient
    .from('booking_reservations')
    .update(updates)
    .eq('id', id)
    .select('id,status,slot_id')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Unable to update reservation.' }, { status: 500 })
  }

  if (existing.status !== 'cancelled' && nextStatus === 'cancelled') {
    const { data: slot } = await auth.serviceClient
      .from('booking_slots')
      .select('booked_count')
      .eq('id', existing.slot_id)
      .maybeSingle()

    const currentCount = Number(slot?.booked_count || 0)
    await auth.serviceClient
      .from('booking_slots')
      .update({ booked_count: Math.max(0, currentCount - 1) })
      .eq('id', existing.slot_id)
  }

  return NextResponse.json({ success: true, reservation: data })
}

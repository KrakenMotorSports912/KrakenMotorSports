import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/serverBooking'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params
  const body = await request.json().catch(() => null)

  const updates: Record<string, unknown> = {}
  if (typeof body?.is_open === 'boolean') updates.is_open = body.is_open
  if (typeof body?.price_cents === 'number') updates.price_cents = body.price_cents
  if (typeof body?.capacity === 'number') updates.capacity = body.capacity
  if (typeof body?.title === 'string') updates.title = body.title

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid update fields provided.' }, { status: 400 })
  }

  const { data, error } = await auth.serviceClient.from('booking_slots').update(updates).eq('id', id).select('*').maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Slot not found.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, slot: data })
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params

  const { data: reservations } = await auth.serviceClient
    .from('booking_reservations')
    .select('id')
    .eq('slot_id', id)
    .neq('status', 'cancelled')

  if ((reservations || []).length > 0) {
    return NextResponse.json({ error: 'Cannot delete a slot that has active reservations.' }, { status: 409 })
  }

  const { error } = await auth.serviceClient.from('booking_slots').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

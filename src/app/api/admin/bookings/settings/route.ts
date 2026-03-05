import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/serverBooking'

const SETTINGS_KEYS = ['booking_open_hour', 'booking_close_hour', 'booking_slot_minutes', 'booking_default_price_cents', 'booking_currency', 'booking_default_capacity']

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await auth.serviceClient
    .from('site_settings')
    .select('key,value_text')
    .in('key', SETTINGS_KEYS)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const settings = Object.fromEntries(
    (data || []).map((row: { key: string; value_text: string | null }) => [row.key, row.value_text || ''])
  )
  return NextResponse.json({ settings })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const openHour = String(body?.openHour ?? '').trim()
  const closeHour = String(body?.closeHour ?? '').trim()
  const slotMinutes = String(body?.slotMinutes ?? '').trim()
  const defaultPriceCents = String(body?.defaultPriceCents ?? '').trim()
  const currency = String(body?.currency ?? 'USD').trim().toUpperCase()
  const defaultCapacity = String(body?.defaultCapacity ?? '').trim()

  const rows = [
    { key: 'booking_open_hour', value_text: openHour },
    { key: 'booking_close_hour', value_text: closeHour },
    { key: 'booking_slot_minutes', value_text: slotMinutes },
    { key: 'booking_default_price_cents', value_text: defaultPriceCents },
    { key: 'booking_currency', value_text: currency },
    { key: 'booking_default_capacity', value_text: defaultCapacity },
  ]

  const { error } = await auth.serviceClient.from('site_settings').upsert(rows, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

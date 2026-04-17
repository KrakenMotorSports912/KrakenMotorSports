import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/serverBooking'
import { getAppBaseUrl, getStripeClient, isStripeConfigured } from '@/lib/stripe'

export const runtime = 'nodejs'

type ReservationPayload = {
  id: string
  slot_id: string
  full_name: string
  email: string
  is_paid: boolean
  status: string
  booking_slots: {
    title: string | null
    start_time: string
    end_time: string
    price_cents: number
    currency: string
  } | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const reservationId = String(body?.reservationId || '').trim()

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId is required.' }, { status: 400 })
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: 'Stripe is not configured yet.',
          paymentReady: false,
        },
        { status: 503 }
      )
    }

    const serviceClient = getServiceClient()

    const { data, error } = await serviceClient
      .from('booking_reservations')
      .select('id,slot_id,full_name,email,is_paid,status,booking_slots(title,start_time,end_time,price_cents,currency)')
      .eq('id', reservationId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const reservation = data as ReservationPayload | null

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 })
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'This reservation was cancelled.' }, { status: 400 })
    }

    if (reservation.is_paid || ['confirmed', 'completed'].includes(reservation.status)) {
      return NextResponse.json({ error: 'This reservation is already paid.' }, { status: 400 })
    }

    const slot = reservation.booking_slots
    if (!slot) {
      return NextResponse.json({ error: 'Booking slot details are missing.' }, { status: 400 })
    }

    const currency = (slot.currency || 'USD').toLowerCase()
    const amount = Number(slot.price_cents || 0)

    if (!Number.isFinite(amount) || amount < 50) {
      return NextResponse.json({ error: 'Invalid booking amount.' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || undefined
    const baseUrl = getAppBaseUrl(origin)

    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: reservation.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: `Kraken Booking: ${slot.title || 'Simulator Session'}`,
              description: `${new Date(slot.start_time).toLocaleString()} to ${new Date(slot.end_time).toLocaleTimeString()}`,
            },
          },
        },
      ],
      metadata: {
        reservation_id: reservation.id,
        slot_id: reservation.slot_id,
      },
      success_url: `${baseUrl}/bookings?payment=success&reservation_id=${reservation.id}`,
      cancel_url: `${baseUrl}/bookings?payment=cancelled&reservation_id=${reservation.id}`,
    })

    const paymentId = session.id

    const updateWithPaymentId = await serviceClient
      .from('booking_reservations')
      .update({ payment_id: paymentId })
      .eq('id', reservation.id)

    if (updateWithPaymentId.error && /payment_id/.test(updateWithPaymentId.error.message)) {
      // Older DB schema may not include payment_id yet.
    }

    return NextResponse.json({
      paymentReady: true,
      reservationId: reservation.id,
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to start checkout.' },
      { status: 500 }
    )
  }
}

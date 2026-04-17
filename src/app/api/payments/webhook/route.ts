import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getServiceClient } from '@/lib/serverBooking'
import { getStripeClient } from '@/lib/stripe'

export const runtime = 'nodejs'

const updateReservationAfterPayment = async (params: {
  reservationId: string
  status: 'confirmed' | 'pending'
  isPaid: boolean
  paymentId: string
  paidAt?: string
}) => {
  const serviceClient = getServiceClient()

  const payload: Record<string, unknown> = {
    status: params.status,
    is_paid: params.isPaid,
    updated_at: new Date().toISOString(),
    payment_id: params.paymentId,
  }

  if (params.paidAt) {
    payload.paid_at = params.paidAt
  }

  const result = await serviceClient
    .from('booking_reservations')
    .update(payload)
    .eq('id', params.reservationId)

  if (result.error && /paid_at/.test(result.error.message)) {
    const fallbackPayload: Record<string, unknown> = {
      status: params.status,
      is_paid: params.isPaid,
      updated_at: new Date().toISOString(),
      payment_id: params.paymentId,
    }

    await serviceClient
      .from('booking_reservations')
      .update(fallbackPayload)
      .eq('id', params.reservationId)
  }
}

const getReservationIdFromSession = (session: Stripe.Checkout.Session) => {
  const metadataId = String(session.metadata?.reservation_id || '').trim()
  if (metadataId) return metadataId
  return ''
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET.' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature header.' }, { status: 400 })
  }

  try {
    const rawBody = await request.text()
    const stripe = getStripeClient()
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const reservationId = getReservationIdFromSession(session)
      if (reservationId) {
        await updateReservationAfterPayment({
          reservationId,
          status: 'confirmed',
          isPaid: true,
          paymentId: session.id,
          paidAt: new Date().toISOString(),
        })
      }
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session
      const reservationId = getReservationIdFromSession(session)
      if (reservationId) {
        await updateReservationAfterPayment({
          reservationId,
          status: 'confirmed',
          isPaid: true,
          paymentId: session.id,
          paidAt: new Date().toISOString(),
        })
      }
    }

    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session
      const reservationId = getReservationIdFromSession(session)
      if (reservationId) {
        await updateReservationAfterPayment({
          reservationId,
          status: 'pending',
          isPaid: false,
          paymentId: session.id,
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 400 }
    )
  }
}

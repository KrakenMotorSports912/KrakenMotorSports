import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/serverBooking'

export const runtime = 'nodejs'

const getAllowedOrigins = () =>
  String(process.env.LOCAL_APP_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

const withCors = (request: NextRequest, response: NextResponse) => {
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = getAllowedOrigins()

  if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Vary', 'Origin')
  }

  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Kraken-App-Key')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')

  return response
}

const validateLocalAppKey = (request: NextRequest) => {
  const configured = process.env.LOCAL_APP_PAYMENT_CONFIRM_KEY
  if (!configured) {
    return { ok: false as const, status: 503, error: 'LOCAL_APP_PAYMENT_CONFIRM_KEY is not configured.' }
  }

  const incoming = request.headers.get('x-kraken-app-key') || ''
  if (!incoming || incoming !== configured) {
    return { ok: false as const, status: 401, error: 'Invalid app key.' }
  }

  return { ok: true as const }
}

export async function OPTIONS(request: NextRequest) {
  return withCors(request, new NextResponse(null, { status: 204 }))
}

export async function POST(request: NextRequest) {
  const keyValidation = validateLocalAppKey(request)
  if (!keyValidation.ok) {
    return withCors(request, NextResponse.json({ error: keyValidation.error }, { status: keyValidation.status }))
  }

  try {
    const body = await request.json().catch(() => null)
    const reservationId = String(body?.reservationId || '').trim()
    const paymentId = String(body?.paymentId || '').trim()

    if (!reservationId && !paymentId) {
      return withCors(
        request,
        NextResponse.json({ error: 'Provide reservationId or paymentId.' }, { status: 400 })
      )
    }

    const serviceClient = getServiceClient()

    let query = serviceClient
      .from('booking_reservations')
      .select('id,slot_id,full_name,email,status,is_paid,payment_id,updated_at')
      .limit(1)

    query = reservationId ? query.eq('id', reservationId) : query.eq('payment_id', paymentId)

    const { data, error } = await query.maybeSingle()

    if (error) {
      return withCors(request, NextResponse.json({ error: error.message }, { status: 500 }))
    }

    if (!data) {
      return withCors(request, NextResponse.json({ error: 'Payment record not found.' }, { status: 404 }))
    }

    const confirmed = Boolean(data.is_paid) || ['confirmed', 'completed'].includes(String(data.status || ''))

    return withCors(
      request,
      NextResponse.json({
        confirmed,
        reservation: data,
      })
    )
  } catch (error) {
    return withCors(
      request,
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unable to confirm payment status.' },
        { status: 500 }
      )
    )
  }
}

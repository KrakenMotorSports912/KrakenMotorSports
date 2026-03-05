import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type FoundersPassInsert = Database['public']['Tables']['founders_passes']['Insert']

const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    const fullName = (body?.fullName || '').trim()
    const rawContact = (body?.contact || body?.email || '').trim()
    const discord = (body?.discord || '').trim()
    const reason = (body?.reason || '').trim()

    if (!fullName || !rawContact) {
      return NextResponse.json({ error: 'Full name and email or phone are required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?[0-9][0-9\s()\-]{6,}$/
    const isEmail = emailRegex.test(rawContact)
    const isPhone = phoneRegex.test(rawContact)
    if (!isEmail && !isPhone) {
      return NextResponse.json({ error: 'Please enter a valid email or phone number.' }, { status: 400 })
    }

    const normalizedContact = isEmail
      ? rawContact.toLowerCase()
      : rawContact.replace(/[\s()\-]/g, '')

    const supabase = getServiceClient()

    const { data: existingByEmail } = await supabase
      .from('founders_passes')
      .select('id,status')
      .eq('email', normalizedContact)
      .neq('status', 'cancelled')
      .limit(1)
      .maybeSingle()

    if (existingByEmail) {
      return NextResponse.json({ error: 'This contact is already on the founders list.' }, { status: 409 })
    }

    const { data: maxPassData, error: maxPassError } = await supabase
      .from('founders_passes')
      .select('pass_number')
      .order('pass_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxPassError) {
      return NextResponse.json({ error: maxPassError.message }, { status: 500 })
    }

    const nextPassNumber = (maxPassData?.pass_number || 0) + 1

    if (nextPassNumber > 50) {
      return NextResponse.json({ error: 'Founders list is currently full.' }, { status: 409 })
    }

    const notesParts: string[] = []
    if (discord) {
      notesParts.push(`Discord: ${discord}`)
    }
    if (reason) {
      notesParts.push(`Reason: ${reason}`)
    }

    const insertData: FoundersPassInsert = {
      pass_number: nextPassNumber,
      email: normalizedContact,
      full_name: fullName,
      payment_method: 'other',
      amount_paid: 0,
      status: 'reserved',
      plaque_name: fullName,
      notes: notesParts.length > 0 ? notesParts.join('\n\n') : null,
    }

    const { data: inserted, error: insertError } = await supabase
      .from('founders_passes')
      .insert(insertData)
      .select('id, pass_number')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: inserted.id, passNumber: inserted.pass_number })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    )
  }
}

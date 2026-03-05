import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey)
}

const isAdminUser = async (userId: string, userEmail: string | null | undefined) => {
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (configuredAdminEmail && userEmail?.toLowerCase().trim() === configuredAdminEmail) {
    return true
  }

  const serviceClient = getServiceClient()
  const { data, error } = await serviceClient
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return false
  }

  return Boolean(data?.is_admin)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await context.params
    if (!entryId) {
      return NextResponse.json({ error: 'Missing entry id' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    const {
      data: { user },
      error: authError,
    } = await serviceClient.auth.getUser(accessToken)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isAdminUser(user.id, user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await serviceClient
      .from('leaderboard_entries')
      .delete()
      .eq('id', entryId)
      .select('id')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await context.params
    if (!entryId) {
      return NextResponse.json({ error: 'Missing entry id' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    const {
      data: { user },
      error: authError,
    } = await serviceClient.auth.getUser(accessToken)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isAdminUser(user.id, user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const nextStatus = body?.status as 'approved' | 'rejected' | 'pending' | undefined
    const rejectionReason = (body?.rejection_reason || null) as string | null

    if (!nextStatus || !['approved', 'rejected', 'pending'].includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updatePayload: Database['public']['Tables']['leaderboard_entries']['Update'] = {
      status: nextStatus,
      rejection_reason: nextStatus === 'rejected' ? rejectionReason : null,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    }

    const { data, error } = await serviceClient
      .from('leaderboard_entries')
      .update(updatePayload)
      .eq('id', entryId)
      .select('id,status,rejection_reason,verified_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, entry: data })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    )
  }
}

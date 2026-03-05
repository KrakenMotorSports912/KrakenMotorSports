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

export async function GET(request: NextRequest) {
  try {
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

    const url = new URL(request.url)
    const filter = url.searchParams.get('filter') || 'all'
    const game = url.searchParams.get('game') || 'all'
    const track = url.searchParams.get('track') || 'all'
    const car = url.searchParams.get('car') || 'all'
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortDirection = url.searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc'

    const allowedSortBy = new Set(['created_at', 'lap_time_ms', 'driver_name', 'track', 'game'])
    const safeSortBy = allowedSortBy.has(sortBy) ? sortBy : 'created_at'

    let query = serviceClient
      .from('leaderboard_entries')
      .select('*')
      .order(safeSortBy as 'created_at', { ascending: sortDirection === 'asc' })

    if (filter !== 'all') {
      query = query.eq('status', filter as 'pending' | 'approved' | 'rejected')
    }

    if (game !== 'all') {
      query = query.eq('game', game)
    }

    if (track !== 'all') {
      query = query.eq('track', track)
    }

    if (car !== 'all') {
      query = query.eq('car', car)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entries: data || [] })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    )
  }
}

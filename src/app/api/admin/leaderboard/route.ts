import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type EventWindow = {
  id: string
  title: string
  game: string
  track: string
  start_date: string
  end_date: string
}

const findMatchingEventTitle = (entry: { game: string; track: string; created_at?: string }, events: EventWindow[]) => {
  const createdAtMs = entry.created_at ? new Date(entry.created_at).getTime() : NaN
  if (!Number.isFinite(createdAtMs)) {
    return ''
  }

  const match = events.find((eventItem) => {
    const startMs = new Date(eventItem.start_date).getTime()
    const endMs = new Date(eventItem.end_date).getTime()
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return false
    }

    return eventItem.game === entry.game && eventItem.track === entry.track && createdAtMs >= startMs && createdAtMs <= endMs
  })

  return match?.title || ''
}

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

    const allowedSortBy = new Set(['created_at', 'lap_time_ms', 'driver_name', 'track', 'game', 'event'])
    const safeSortBy = allowedSortBy.has(sortBy) ? sortBy : 'created_at'

    let query = serviceClient
      .from('leaderboard_entries')
      .select('*')
      .order((safeSortBy === 'event' ? 'created_at' : safeSortBy) as 'created_at', { ascending: sortDirection === 'asc' })

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

    const entries = data || []

    if (safeSortBy === 'event') {
      const { data: eventsData, error: eventsError } = await serviceClient
        .from('events')
        .select('id,title,game,track,start_date,end_date')
        .order('start_date', { ascending: true })

      if (!eventsError && eventsData) {
        const events = eventsData as EventWindow[]
        const sorted = [...entries]
          .map((entry) => ({
            ...entry,
            event_title: findMatchingEventTitle(entry, events),
          }))
          .sort((left, right) => {
            const leftTitle = left.event_title || ''
            const rightTitle = right.event_title || ''
            if (leftTitle !== rightTitle) {
              const compare = leftTitle.localeCompare(rightTitle)
              return sortDirection === 'asc' ? compare : -compare
            }

            const leftTime = new Date(left.created_at).getTime()
            const rightTime = new Date(right.created_at).getTime()
            return sortDirection === 'asc' ? leftTime - rightTime : rightTime - leftTime
          })

        return NextResponse.json({ entries: sorted })
      }
    }

    return NextResponse.json({ entries })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    )
  }
}

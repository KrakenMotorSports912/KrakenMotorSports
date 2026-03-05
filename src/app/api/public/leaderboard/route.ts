import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey)
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game')
    const track = searchParams.get('track')
    const car = searchParams.get('car')
    const eventId = searchParams.get('event_id')
    const rawLimit = Number(searchParams.get('limit') || 10)
    const limit = Math.min(Math.max(rawLimit, 1), 100)

    const supabase = getAdminClient()

    let eventFilter: {
      id: string
      title: string
      game: string
      track: string
      start_date: string
      end_date: string
    } | null = null

    if (eventId) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id,title,game,track,start_date,end_date')
        .eq('id', eventId)
        .maybeSingle()

      if (eventError) {
        return NextResponse.json(
          { error: 'Failed to fetch event filter', details: eventError.message },
          { status: 500, headers: corsHeaders }
        )
      }

      if (!eventData) {
        return NextResponse.json(
          { error: 'Event not found for event_id filter' },
          { status: 404, headers: corsHeaders }
        )
      }

      eventFilter = eventData
    }

    let query = supabase
      .from('leaderboard_entries')
      .select('id,driver_name,game,track,car,lap_time_display,lap_time_ms,created_at')
      .eq('status', 'approved')
      .order('lap_time_ms', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit)

    if (eventFilter) {
      query = query
        .eq('game', eventFilter.game)
        .eq('track', eventFilter.track)
        .gte('created_at', eventFilter.start_date)
        .lte('created_at', eventFilter.end_date)
    } else {
      if (game) {
        query = query.eq('game', game)
      }

      if (track) {
        query = query.ilike('track', `%${track}%`)
      }
    }

    if (car) {
      query = query.ilike('car', `%${car}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard', details: error.message },
        { status: 500, headers: corsHeaders }
      )
    }

    const leaderboard = (data ?? []).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }))

    return NextResponse.json(
      {
        leaderboard,
        count: leaderboard.length,
        event_filter: eventFilter,
        generated_at: new Date().toISOString(),
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Server configuration error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

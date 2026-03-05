import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { FALLBACK_GAMES, FALLBACK_TRACKS, parseOptionsInput } from '@/lib/adminDefaults'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

type OptionType = 'games' | 'tracks' | 'cars' | 'events'

type SiteSettingRow = {
  key: string
  value_text: string | null
}

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey)
}

const toGameLabel = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const truncate = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 1))}…`

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'games') as OptionType
    const queryText = (searchParams.get('q') || '').toLowerCase().trim()
    const rawLimit = Number(searchParams.get('limit') || 25)
    const limit = Math.min(Math.max(rawLimit, 1), 25)

    if (!['games', 'tracks', 'cars', 'events'].includes(type)) {
      return NextResponse.json({ error: 'Invalid option type' }, { status: 400, headers: corsHeaders })
    }

    const supabase = getAdminClient()

    const untypedClient = supabase as any

    const [leaderboardResult, defaultsResult, eventsResult] = await Promise.all([
      supabase.from('leaderboard_entries').select('game,track,car').eq('status', 'approved').limit(1000),
      untypedClient.from('site_settings').select('key, value_text').in('key', ['default_games', 'default_tracks']),
      supabase
        .from('events')
        .select('id,title,game,track,start_date')
        .eq('is_active', true)
        .order('start_date', { ascending: true })
        .limit(100),
    ])

    const leaderboardRows = leaderboardResult.data || []
    const events = eventsResult.data || []

    const defaultsRows = !defaultsResult.error ? ((defaultsResult.data || []) as SiteSettingRow[]) : []
    const defaultGames = parseOptionsInput(defaultsRows.find((item) => item.key === 'default_games')?.value_text || '')
    const defaultTracks = parseOptionsInput(defaultsRows.find((item) => item.key === 'default_tracks')?.value_text || '')

    if (type === 'events') {
      const eventOptions = events
        .map((event) => ({
          value: event.id,
          name: truncate(`${event.title} (${event.game} • ${event.track})`, 100),
        }))
        .filter((item) => !queryText || item.name.toLowerCase().includes(queryText) || item.value.toLowerCase().includes(queryText))
        .slice(0, limit)

      return NextResponse.json(
        {
          options: eventOptions,
          count: eventOptions.length,
          generated_at: new Date().toISOString(),
        },
        {
          headers: {
            ...corsHeaders,
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        }
      )
    }

    const valuesFromRows =
      type === 'games'
        ? leaderboardRows.map((row) => row.game)
        : type === 'tracks'
        ? leaderboardRows.map((row) => row.track)
        : leaderboardRows.map((row) => row.car)

    const defaultsForType =
      type === 'games' ? [...FALLBACK_GAMES, ...defaultGames] : type === 'tracks' ? [...FALLBACK_TRACKS, ...defaultTracks] : []

    const combined = Array.from(new Set([...valuesFromRows.filter(Boolean), ...defaultsForType]))
      .filter((value) => !queryText || value.toLowerCase().includes(queryText))
      .sort((left, right) => left.localeCompare(right))
      .slice(0, limit)

    const options = combined.map((value) => ({
      value,
      name: truncate(type === 'games' ? toGameLabel(value) : value, 100),
    }))

    return NextResponse.json(
      {
        options,
        count: options.length,
        generated_at: new Date().toISOString(),
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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

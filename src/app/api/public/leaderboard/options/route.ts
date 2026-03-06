import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import {
  FALLBACK_CARS,
  FALLBACK_GAMES,
  FALLBACK_TRACKS,
  buildCatalogFromFlatDefaults,
  flattenGameCatalog,
  parseDefaultGameCatalog,
  parseOptionsInput,
} from '@/lib/adminDefaults'

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

const normalizeGameKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const GAME_KEY_ALIASES: Record<string, string> = {
  mariokart: 'mario_kart_wii',
  mario_kart: 'mario_kart_wii',
  mk_wii: 'mario_kart_wii',
  mkwii: 'mario_kart_wii',
  forza_horizon: 'forza_horizon_5',
  forza_4: 'forza_horizon_4',
  forza_5: 'forza_horizon_5',
  fh4: 'forza_horizon_4',
  fh5: 'forza_horizon_5',
  forza_motorsport: 'forza_motorsport_2023',
  forza_motorsport_8: 'forza_motorsport_2023',
  fm7: 'forza_motorsport_7',
}

const resolveGameKey = (value: string) => {
  const normalized = normalizeGameKey(value)
  return GAME_KEY_ALIASES[normalized] || normalized
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
    const selectedGame = resolveGameKey(searchParams.get('game') || '')
    const defaultsOnly = ['1', 'true', 'yes'].includes((searchParams.get('defaults_only') || '').toLowerCase())
    const queryText = (searchParams.get('q') || '').toLowerCase().trim()
    const rawLimit = Number(searchParams.get('limit') || 25)
    const limit = Math.min(Math.max(rawLimit, 1), 25)

    if (!['games', 'tracks', 'cars', 'events'].includes(type)) {
      return NextResponse.json({ error: 'Invalid option type' }, { status: 400, headers: corsHeaders })
    }

    const supabase = getAdminClient()

    const untypedClient = supabase as any

    const [leaderboardResult, defaultsResult, eventsResult] = await Promise.all([
      defaultsOnly
        ? Promise.resolve({ data: [], error: null } as any)
        : supabase.from('leaderboard_entries').select('game,track,car').eq('status', 'approved').limit(1000),
      untypedClient.from('site_settings').select('key, value_text').in('key', ['default_games', 'default_tracks', 'default_cars', 'default_game_catalog']),
      supabase
        .from('events')
        .select('id,title,game,track,start_date')
        .eq('is_active', true)
        .order('start_date', { ascending: true })
        .limit(100),
    ])

    const leaderboardRows = (leaderboardResult.data || []) as Array<{ game: string; track: string; car: string }>
    const events = eventsResult.data || []

    const defaultsRows = !defaultsResult.error ? ((defaultsResult.data || []) as SiteSettingRow[]) : []
    const defaultGames = parseOptionsInput(defaultsRows.find((item) => item.key === 'default_games')?.value_text || '')
    const defaultTracks = parseOptionsInput(defaultsRows.find((item) => item.key === 'default_tracks')?.value_text || '')
    const defaultCars = parseOptionsInput(defaultsRows.find((item) => item.key === 'default_cars')?.value_text || '')
    const defaultCatalog = parseDefaultGameCatalog(defaultsRows.find((item) => item.key === 'default_game_catalog')?.value_text || '')
    const catalog =
      defaultCatalog.length > 0
        ? defaultCatalog
        : buildCatalogFromFlatDefaults(defaultGames, defaultTracks, defaultCars)
    const flattenedCatalog = flattenGameCatalog(catalog)
    const selectedCatalogNode = selectedGame ? catalog.find((item) => resolveGameKey(item.game) === selectedGame) : null

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

    const leaderboardRowsForType =
      selectedGame && (type === 'tracks' || type === 'cars')
        ? leaderboardRows.filter((row) => resolveGameKey(row.game || '') === selectedGame)
        : leaderboardRows

    const valuesFromRows =
      type === 'games'
        ? leaderboardRowsForType.map((row) => row.game)
        : type === 'tracks'
        ? leaderboardRowsForType.map((row) => row.track)
        : leaderboardRowsForType.map((row) => row.car)

    const isGameScopedOptions = Boolean(selectedGame) && (type === 'tracks' || type === 'cars')

    const defaultsForType =
      type === 'games'
        ? [...FALLBACK_GAMES, ...flattenedCatalog.games]
        : type === 'tracks'
        ? isGameScopedOptions
          ? selectedCatalogNode?.tracks || []
          : [...FALLBACK_TRACKS, ...flattenedCatalog.tracks]
        : type === 'cars'
        ? isGameScopedOptions
          ? selectedCatalogNode?.cars || []
          : [...FALLBACK_CARS, ...flattenedCatalog.cars]
        : []

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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import {
  FALLBACK_GAMES,
  flattenGameCatalog,
  parseDefaultGameCatalog,
  parseOptionsInput,
} from '@/lib/adminDefaults'

const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey)
}

const parseLapTime = (timeStr: string): { milliseconds: number; formatted: string } | null => {
  const normalized = timeStr.trim().replace(',', '.')

  let minutes = 0
  let seconds = 0
  let milliseconds = 0

  const minuteSecondMatch = normalized.match(/^(\d{1,3}):([0-5]?\d)(?:[.:](\d{1,3}))?$/)
  const secondMatch = normalized.match(/^([0-5]?\d)(?:[.:](\d{1,3}))$/)

  if (minuteSecondMatch) {
    const [, minutesRaw, secondsRaw, millisRaw = '0'] = minuteSecondMatch
    minutes = parseInt(minutesRaw, 10)
    seconds = parseInt(secondsRaw, 10)
    milliseconds = parseInt(millisRaw.padEnd(3, '0'), 10)
  } else if (secondMatch) {
    const [, secondsRaw, millisRaw] = secondMatch
    minutes = 0
    seconds = parseInt(secondsRaw, 10)
    milliseconds = parseInt(millisRaw.padEnd(3, '0'), 10)
  } else {
    return null
  }

  const totalMilliseconds = minutes * 60000 + seconds * 1000 + milliseconds
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`

  return {
    milliseconds: totalMilliseconds,
    formatted,
  }
}

const normalizeGameKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

// Keep compatibility with legacy DB check constraints that still use broad Forza keys.
const LEGACY_GAME_KEY_MAP: Record<string, string> = {
  forza_horizon_4: 'forza_horizon',
  forza_horizon_5: 'forza_horizon',
  fh4: 'forza_horizon',
  fh5: 'forza_horizon',
  forza_4: 'forza_horizon',
  forza_5: 'forza_horizon',
  forza_motorsport_7: 'forza_motorsport',
  forza_motorsport_2023: 'forza_motorsport',
  forza_motorsport_8: 'forza_motorsport',
}

const GAME_ALIASES: Record<string, string> = {
  mariokart: 'mario_kart_wii',
  mario_kart: 'mario_kart_wii',
  mario_kart_wii: 'mario_kart_wii',
  mk_wii: 'mario_kart_wii',
  mkwii: 'mario_kart_wii',
}

const toCanonicalGameKey = (value: string) => {
  const normalized = normalizeGameKey(value)
  return GAME_ALIASES[normalized] || normalized
}

type SiteSettingRow = {
  key: string
  value_text: string | null
}

const getKnownGameKeys = async (supabase: ReturnType<typeof getServiceClient>) => {
  const { data, error } = await (supabase as any)
    .from('site_settings')
    .select('key, value_text')
    .in('key', ['default_games', 'default_game_catalog'])

  if (error || !data) {
    return new Set(FALLBACK_GAMES)
  }

  const rows = data as SiteSettingRow[]
  const gamesText = parseOptionsInput(rows.find((item) => item.key === 'default_games')?.value_text || '')
  const gameCatalog = parseDefaultGameCatalog(rows.find((item) => item.key === 'default_game_catalog')?.value_text || '')
  const gamesFromCatalog = flattenGameCatalog(gameCatalog).games

  return new Set([...FALLBACK_GAMES, ...gamesText, ...gamesFromCatalog].map((item) => toCanonicalGameKey(item)))
}

const toStoredGameValue = (rawValue: string, knownGames: Set<string>) => {
  const canonical = toCanonicalGameKey(rawValue)
  if (knownGames.has(canonical)) {
    return canonical
  }

  const rawLabel = rawValue.trim()
  return rawLabel ? `other (${rawLabel})` : 'other'
}

const getGameInsertCandidates = (value: string) => {
  const trimmed = value.trim()
  if (/^other\s*\(/i.test(trimmed)) {
    return [trimmed]
  }

  const canonical = toCanonicalGameKey(trimmed)
  const mapped = LEGACY_GAME_KEY_MAP[canonical]
  return mapped && mapped !== canonical ? [canonical, mapped] : [canonical]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    const driverName = (body?.driverName || '').trim()
    const game = (body?.game || '').trim()
    const track = (body?.track || '').trim()
    const car = (body?.car || '').trim()
    const lapTime = (body?.lapTime || '').trim()
    const screenshotUrl = (body?.screenshotUrl || '').trim()
    const videoUrl = (body?.videoUrl || '').trim()
    const selectedEventId = (body?.selectedEventId || '').trim()

    if (!driverName || !game || !track || !car || !lapTime) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const parsed = parseLapTime(lapTime)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid lap time format. Use M:SS, M:SS.m, M:SS.mm, or M:SS.mmm.' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    let finalGame = game
    let finalTrack = track

    if (selectedEventId) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id,game,track,is_active')
        .eq('id', selectedEventId)
        .maybeSingle()

      if (eventError) {
        return NextResponse.json({ error: eventError.message }, { status: 500 })
      }

      if (!eventData) {
        return NextResponse.json({ error: 'Selected event was not found.' }, { status: 400 })
      }

      finalGame = eventData.game
      finalTrack = eventData.track
    }

    const knownGameKeys = await getKnownGameKeys(supabase)
    const storedGameValue = toStoredGameValue(finalGame, knownGameKeys)
    const gameCandidates = getGameInsertCandidates(storedGameValue)

    let insertedId: string | null = null
    let lastInsertError: string | null = null

    for (let index = 0; index < gameCandidates.length; index += 1) {
      const candidateGame = gameCandidates[index]
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .insert({
          driver_name: driverName,
          game: candidateGame,
          track: finalTrack,
          car,
          lap_time_ms: parsed.milliseconds,
          lap_time_display: parsed.formatted,
          screenshot_url: screenshotUrl || null,
          video_url: videoUrl || null,
          status: 'pending',
        })
        .select('id')
        .single()

      if (!error) {
        insertedId = data.id
        break
      }

      lastInsertError = error.message
      const isGameConstraintError =
        error.code === '23514' &&
        typeof error.message === 'string' &&
        error.message.includes('leaderboard_entries_game_check')

      // Only try the fallback mapped key when the first attempt failed on game check constraint.
      if (!isGameConstraintError || index === gameCandidates.length - 1) {
        break
      }
    }

    if (!insertedId) {
      const isConstraintFailure =
        typeof lastInsertError === 'string' &&
        lastInsertError.includes('leaderboard_entries_game_check')

      if (isConstraintFailure) {
        return NextResponse.json(
          {
            error:
              'Database game constraint is outdated. Run SUPABASE_FLEXIBLE_GAMES_UPDATE.sql in Supabase SQL Editor so custom games (for example mario_kart_wii) can be stored.',
          },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: lastInsertError || 'Unable to create leaderboard entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: insertedId, status: 'pending' })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected server error',
      },
      { status: 500 }
    )
  }
}

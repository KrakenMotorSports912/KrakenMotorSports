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

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .insert({
        driver_name: driverName,
        game: finalGame,
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id, status: 'pending' })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected server error',
      },
      { status: 500 }
    )
  }
}

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

const parseLapTime = (timeStr: string): { milliseconds: number; formatted: string } | null => {
  const normalized = timeStr.trim().replace(',', '.')

  const minuteSecondMatch = normalized.match(/^(\d{1,3}):([0-5]?\d)(?:[.:](\d{1,3}))?$/)
  const secondMatch = normalized.match(/^([0-5]?\d)(?:[.:](\d{1,3}))$/)

  let minutes = 0
  let seconds = 0
  let milliseconds = 0

  if (minuteSecondMatch) {
    const [, minutesRaw, secondsRaw, millisRaw = '0'] = minuteSecondMatch
    minutes = parseInt(minutesRaw, 10)
    seconds = parseInt(secondsRaw, 10)
    milliseconds = parseInt(millisRaw.padEnd(3, '0'), 10)
  } else if (secondMatch) {
    const [, secondsRaw, millisRaw] = secondMatch
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

    const updatePayload: Database['public']['Tables']['leaderboard_entries']['Update'] = {}

    if (typeof body?.driver_name === 'string') {
      const value = body.driver_name.trim()
      if (!value) {
        return NextResponse.json({ error: 'Driver name cannot be blank' }, { status: 400 })
      }
      updatePayload.driver_name = value
    }

    if (typeof body?.game === 'string') {
      const value = body.game.trim()
      if (!value) {
        return NextResponse.json({ error: 'Game cannot be blank' }, { status: 400 })
      }
      updatePayload.game = value
    }

    if (typeof body?.track === 'string') {
      const value = body.track.trim()
      if (!value) {
        return NextResponse.json({ error: 'Track cannot be blank' }, { status: 400 })
      }
      updatePayload.track = value
    }

    if (typeof body?.car === 'string') {
      const value = body.car.trim()
      if (!value) {
        return NextResponse.json({ error: 'Car cannot be blank' }, { status: 400 })
      }
      updatePayload.car = value
    }

    if (typeof body?.lap_time_display === 'string') {
      const parsed = parseLapTime(body.lap_time_display)
      if (!parsed) {
        return NextResponse.json(
          { error: 'Invalid lap time format. Use M:SS, M:SS.m, M:SS.mm, or M:SS.mmm.' },
          { status: 400 }
        )
      }
      updatePayload.lap_time_display = parsed.formatted
      updatePayload.lap_time_ms = parsed.milliseconds
    }

    if (typeof body?.screenshot_url === 'string') {
      updatePayload.screenshot_url = body.screenshot_url.trim() || null
    }

    if (typeof body?.video_url === 'string') {
      updatePayload.video_url = body.video_url.trim() || null
    }

    if (nextStatus !== undefined) {
      if (!['approved', 'rejected', 'pending'].includes(nextStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      updatePayload.status = nextStatus
      updatePayload.rejection_reason = nextStatus === 'rejected' ? rejectionReason : null
      updatePayload.verified_by = user.id
      updatePayload.verified_at = new Date().toISOString()
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const { data, error } = await serviceClient
      .from('leaderboard_entries')
      .update(updatePayload)
      .eq('id', entryId)
      .select('id,driver_name,game,track,car,lap_time_display,lap_time_ms,screenshot_url,video_url,status,rejection_reason,verified_at')
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

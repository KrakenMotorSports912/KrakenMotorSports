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
    const eventType = searchParams.get('event_type')
    const rawLimit = Number(searchParams.get('limit') || 10)
    const limit = Math.min(Math.max(rawLimit, 1), 50)

    const supabase = getAdminClient()
    let query = supabase
      .from('events')
      .select('id,title,description,event_type,game,track,car_class,start_date,end_date,prize,max_participants,current_participants,is_active')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit)

    if (game) {
      query = query.eq('game', game)
    }

    if (eventType) {
      query = query.eq('event_type', eventType as Database['public']['Tables']['events']['Row']['event_type'])
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        events: data ?? [],
        count: data?.length ?? 0,
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

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export const requireAdminUser = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || ''
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!accessToken) {
    return { ok: false as const, status: 401, error: 'Unauthorized' }
  }

  const serviceClient = getServiceClient()
  const {
    data: { user },
    error: authError,
  } = await serviceClient.auth.getUser(accessToken)

  if (authError || !user) {
    return { ok: false as const, status: 401, error: 'Unauthorized' }
  }

  const configuredAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (configuredAdminEmail && user.email?.toLowerCase().trim() === configuredAdminEmail) {
    return { ok: true as const, user, serviceClient }
  }

  const { data, error } = await serviceClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data?.is_admin) {
    return { ok: false as const, status: 403, error: 'Forbidden' }
  }

  return { ok: true as const, user, serviceClient }
}

export const isMissingBookingTables = (message: string) =>
  /booking_slots|booking_reservations|could not find the table/i.test(message)

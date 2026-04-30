import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DISABLED =
  process.env.NEXT_PUBLIC_APP_DISABLED === '1' ||
  process.env.NEXT_PUBLIC_APP_DISABLED === 'true'

export function middleware(req: NextRequest) {
  if (!DISABLED) return NextResponse.next()

  const { pathname } = req.nextUrl

  // Allow internal Next.js assets, healthchecks, and the maintenance page itself
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/_status' ||
    pathname === '/maintenance' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  return NextResponse.rewrite(new URL('/maintenance', req.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

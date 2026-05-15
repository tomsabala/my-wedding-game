import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

// 3-letter slug routes (/abc, /xyz, ...) are always public — no auth needed
const SLUG_RE = /^\/[a-z]{3}(\/.*)?$/

export async function middleware(request: NextRequest) {
  // Strip any client-supplied x-user-id to prevent header injection.
  // We set it ourselves below after getUser() succeeds so RSCs can skip
  // the redundant second Supabase network call.
  const forwardedHeaders = new Headers(request.headers)
  forwardedHeaders.delete('x-user-id')

  // Collect cookies that Supabase wants to refresh so we can apply them
  // to the final response after we know the user ID.
  const pendingCookies: CookieToSet[] = []

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // Keep request cookies up-to-date for the current execution
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          pendingCookies.push(...cookiesToSet)
        },
      },
    },
  )

  // Read session from cookie — local parse, no Supabase Auth network call.
  // Token refresh (if expiring) still happens via the setAll cookie handler.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // Stamp the verified user ID so RSCs can use getSession() (cookie read,
  // no network) instead of calling getUser() again.
  if (user) {
    forwardedHeaders.set('x-user-id', user.id)
  }

  // Build the final response forwarding our headers to the RSC layer
  const response = NextResponse.next({ request: { headers: forwardedHeaders } })

  // Apply any cookie refreshes Supabase requested
  pendingCookies.forEach(({ name, value, options }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any),
  )

  const { pathname } = request.nextUrl

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password')
  const isSlugRoute = SLUG_RE.test(pathname)
  const isPublicRoute =
    pathname === '/' || isAuthRoute || isSlugRoute || pathname.startsWith('/auth/callback')

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

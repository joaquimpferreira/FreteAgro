// middleware.ts — Next.js route-protection middleware (FR-004)
// Principle VI: every authenticated route MUST be guarded; no exceptions.
// Delegates all session logic to lib/auth/config.ts (constitution §II).

import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

// Paths that are accessible without authentication
const PUBLIC_PATHS = [
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/api/auth',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Always allow public paths and Next.js internal routes
  if (isPublicPath(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Unauthenticated: API routes → 401, web routes → redirect to /login
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada.' },
        { status: 401 },
      )
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  // Apply to all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}

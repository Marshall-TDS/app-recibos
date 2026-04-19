import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  // Lógica de proteção de rotas
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isLoginPage = request.nextUrl.pathname === '/'

  // 1. Se tentar acessar dashboard sem usuário, vai para o login (/)
  if (isDashboardRoute && !user) {
    return Response.redirect(new URL('/', request.url))
  }

  // 2. Se estiver logado e tentar acessar login, vai para o dashboard
  if (isLoginPage && user) {
    return Response.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// proxy.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "[proxy] NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias."
  )
}

const PUBLIC_ROUTES = ["/login", "/cadastro", "/trocar-senha", "/auth/callback", "/auth/erro"]

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Sem sessão → login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Com sessão em rota pública → início
  if (session && isPublicRoute && pathname !== "/trocar-senha") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Com sessão mas precisa trocar senha → redireciona para /trocar-senha
  if (session && !isPublicRoute && pathname !== "/trocar-senha") {
    const precisaTrocar = session.user.user_metadata?.precisaTrocarSenha
    if (precisaTrocar) {
      return NextResponse.redirect(new URL("/trocar-senha", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/logout|api/auth/cadastro|auth/callback|auth/erro).*)",
  ],
}
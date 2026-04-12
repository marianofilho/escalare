import { NextResponse } from "next/server"
import { LoginSchema } from "@/dtos/auth/login.dto"
import { authService } from "@/services/auth.service"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { CredenciaisInvalidasError, NaoAutorizadoError } from "@/types/errors"
import { ZodError } from "zod"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()
    const dto = LoginSchema.parse(body)

    const supabase = await createSupabaseServerClient()
    const { usuario, accessToken } = await authService.login(dto, supabase)

    return NextResponse.json({ usuario, accessToken }, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    if (error instanceof CredenciaisInvalidasError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof NaoAutorizadoError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("[POST /api/auth/login]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
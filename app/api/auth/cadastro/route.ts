import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { CadastroSchema } from "@/dtos/auth/cadastro.dto"
import { cadastroService, SlugJaExisteError, CadastroSupabaseError } from "@/services/cadastro.service"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()
    const dto = CadastroSchema.parse(body)

    const supabase = await createSupabaseServerClient()
    const resultado = await cadastroService.cadastrar(dto, supabase)

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", detalhes: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    if (error instanceof SlugJaExisteError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error instanceof CadastroSupabaseError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("[POST /api/auth/cadastro]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
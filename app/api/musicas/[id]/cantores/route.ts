// src/app/api/musicas/[id]/cantores/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { VincularCantorSchema } from "@/dtos/musica/criar-musica.dto"
import { makeMusicaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"
import { resolveSession } from "@/lib/resolve-session"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const resolved = await resolveSession(session)
    if (!resolved) return NextResponse.json({ error: "Membro não encontrado" }, { status: 403 })

    const { igrejaId, membroId } = resolved

    const body: unknown = await request.json()
    const dto = VincularCantorSchema.parse(body)

    const vinculo = await makeMusicaService().vincularCantor(id, igrejaId, membroId, dto)
    return NextResponse.json(vinculo, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
// src/app/api/musicas/[id]/cantores/[cantorId]/faixas/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { CriarFaixaSchema } from "@/dtos/musica/criar-musica.dto"
import { makeMusicaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"
import { resolveSession } from "@/lib/resolve-session"

interface RouteParams {
  params: Promise<{ id: string; cantorId: string }>
}

// POST /api/musicas/[id]/cantores/[cantorId]/faixas
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id, cantorId } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const resolved = await resolveSession(session)
    if (!resolved) return NextResponse.json({ error: "Membro não encontrado" }, { status: 403 })
    
    const { igrejaId, membroId } = resolved

    const body: unknown = await request.json()
    const dto = CriarFaixaSchema.parse(body)

    const faixa = await makeMusicaService().adicionarFaixa(id, cantorId, igrejaId, membroId, dto)
    return NextResponse.json(faixa, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
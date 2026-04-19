// src/app/api/musicas/[id]/cantores/[cantorId]/faixas/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { CriarFaixaSchema } from "@/dtos/musica/criar-musica.dto"
import { makeMusicaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string; cantorId: string }>
}

// POST /api/musicas/[id]/cantores/[cantorId]/faixas
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id, cantorId } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = CriarFaixaSchema.parse(body)

    const faixa = await makeMusicaService().adicionarFaixa(id, cantorId, igrejaId, membroId, dto)
    return NextResponse.json(faixa, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
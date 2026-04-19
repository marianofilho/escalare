// src/app/api/musicas/[id]/cantores/[cantorId]/faixas/[faixaId]/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AtualizarFaixaSchema } from "@/dtos/musica/criar-musica.dto"
import { makeMusicaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string; cantorId: string; faixaId: string }>
}

// PATCH /api/musicas/[id]/cantores/[cantorId]/faixas/[faixaId]
export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { faixaId } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = AtualizarFaixaSchema.parse(body)

    const faixa = await makeMusicaService().atualizarFaixa(faixaId, igrejaId, membroId, dto)
    return NextResponse.json(faixa)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/musicas/[id]/cantores/[cantorId]/faixas/[faixaId]
export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { faixaId } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    await makeMusicaService().removerFaixa(faixaId, igrejaId, membroId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
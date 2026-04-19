// src/app/api/cultos/[id]/repertorio/itens/[itemId]/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AtualizarItemSchema } from "@/dtos/repertorio/criar-repertorio.dto"
import { makeRepertorioService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>
}

// PATCH /api/cultos/[id]/repertorio/itens/[itemId] — atualiza ordem/observações
export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id, itemId } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = AtualizarItemSchema.parse(body)

    const item = await makeRepertorioService().atualizarItem(id, itemId, igrejaId, membroId, dto)
    return NextResponse.json(item)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/cultos/[id]/repertorio/itens/[itemId] — remove música do repertório
export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id, itemId } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    await makeRepertorioService().removerItem(id, itemId, igrejaId, membroId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
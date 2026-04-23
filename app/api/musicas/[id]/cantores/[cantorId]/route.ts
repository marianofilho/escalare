// src/app/api/musicas/[id]/cantores/[cantorId]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { AtualizarCantorSchema } from "@/dtos/musica/criar-musica.dto"
import { makeMusicaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string; cantorId: string }>
}

// PATCH /api/musicas/[id]/cantores/[cantorId] — atualiza tom e links do cantor
export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id, cantorId } = await params

    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user_metadata?.igrejaId as string
    const membroId = session.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = AtualizarCantorSchema.parse(body)

    const vinculo = await makeMusicaService().atualizarVinculo(
      id,
      igrejaId,
      cantorId,
      dto,
      membroId
    )
    return NextResponse.json(vinculo)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/musicas/[id]/cantores/[cantorId] — remove o vínculo cantor ↔ música
export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id, cantorId } = await params

    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user_metadata?.igrejaId as string
    const membroId = session.user_metadata?.membroId as string

    await makeMusicaService().removerVinculo(id, igrejaId, cantorId, membroId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
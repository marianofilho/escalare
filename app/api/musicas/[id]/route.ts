// src/app/api/musicas/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { AtualizarMusicaSchema } from "@/dtos/musica/criar-musica.dto"
import { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import { makeMusicaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user_metadata?.igrejaId as string

    const musica = await makeMusicaService().buscarPorId(id, igrejaId)
    return NextResponse.json(MusicaResponseDto.from(musica))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user_metadata?.igrejaId as string
    const membroId = session.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = AtualizarMusicaSchema.parse(body)

    const musica = await makeMusicaService().atualizar(id, igrejaId, dto, membroId)
    return NextResponse.json(MusicaResponseDto.from(musica))
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE = arquivar (soft delete), não apaga do banco
export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user_metadata?.igrejaId as string
    const membroId = session.user_metadata?.membroId as string

    await makeMusicaService().arquivar(id, igrejaId, membroId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
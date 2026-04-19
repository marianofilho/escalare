// src/app/api/musicas/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { AtualizarMusicaSchema } from "@/dtos/musica/criar-musica.dto"
import { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import { makeMusicaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: { id: string }
}

export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const usuario = session.user_metadata?.igrejaId

    const musica = await makeMusicaService().buscarPorId(id, usuario.igrejaId)
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

    const usuario = session.user_metadata?.igrejaId
    const body: unknown = await request.json()
    const dto = AtualizarMusicaSchema.parse(body)

    const musica = await makeMusicaService().atualizar(id, usuario.igrejaId, dto, usuario.id)
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

    const usuario = session.user_metadata?.igrejaId

    await makeMusicaService().arquivar(id, usuario.igrejaId, usuario.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
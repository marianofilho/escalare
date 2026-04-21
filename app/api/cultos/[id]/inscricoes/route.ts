// src/app/api/cultos/[id]/inscricoes/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { InscricaoCultoSchema } from "@/dtos/culto/criar-culto.dto"
import { makeCultoService, makeMembroService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: cultoId } = await params

    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string

    const body = await request.json()
    const dto = InscricaoCultoSchema.parse(body)

    // Verifica se e admin para liberar inscricao forcada ou de outro membro
    const isAdmin = await makeMembroService()
      .buscarPorId(membroId, igrejaId)
      .then((m) => m.perfil === "ADMINISTRADOR")
      .catch(() => false)

    // Admin inscrevendo outro membro (membroIdAlvo informado)
    if (dto.membroIdAlvo && dto.membroIdAlvo !== membroId) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Apenas administradores podem inscrever outros membros" },
          { status: 403 }
        )
      }

      // Valida que o membro alvo existe na mesma igreja
      await makeMembroService().buscarPorId(dto.membroIdAlvo, igrejaId)

      const inscricao = await makeCultoService().inscreverComoAdmin(
        cultoId,
        igrejaId,
        dto.membroIdAlvo,
        dto
      )
      return NextResponse.json(inscricao, { status: 201 })
    }

    // Admin forcando inscricao propria em culto fechado
    if (dto.forcarInscricao && isAdmin) {
      const inscricao = await makeCultoService().inscreverComoAdmin(
        cultoId,
        igrejaId,
        membroId,
        dto
      )
      return NextResponse.json(inscricao, { status: 201 })
    }

    // Inscricao normal
    const inscricao = await makeCultoService().inscrever(cultoId, igrejaId, membroId, dto)
    return NextResponse.json(inscricao, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: cultoId } = await params

    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string

    await makeCultoService().cancelarInscricao(cultoId, igrejaId, membroId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
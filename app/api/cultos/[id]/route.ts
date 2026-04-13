// src/app/api/cultos/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { AtualizarCultoSchema } from "@/dtos/culto/criar-culto.dto"
import { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import { makeCultoService, makeMembroService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const culto = await makeCultoService().buscarPorId(id, igrejaId)
    return NextResponse.json(CultoResponseDto.from(culto))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string

    const membroAtual = await makeMembroService().buscarPorId(membroId, igrejaId)
    if (membroAtual.perfil !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Apenas administradores podem editar cultos" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const dto = AtualizarCultoSchema.parse(body)
    const culto = await makeCultoService().atualizar(id, igrejaId, dto)
    return NextResponse.json(CultoResponseDto.from(culto))
  } catch (error) {
    return handleApiError(error)
  }
}
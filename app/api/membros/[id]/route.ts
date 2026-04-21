// src/app/api/membros/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { makeMembroService } from "@/lib/factories"
import { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import { AtualizarMembroSchema } from "@/dtos/membro/criar-membro.dto"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string

    // Retorna perfil completo com histórico de cultos e músicas
    const perfil = await makeMembroService().buscarPerfilCompleto(id, igrejaId)
    return NextResponse.json(perfil)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string

    const membroAtual = await makeMembroService().buscarPorId(membroId, igrejaId)
    if (membroAtual.perfil !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Apenas administradores podem editar membros" }, { status: 403 })
    }

    const body = await request.json()
    const dto = AtualizarMembroSchema.parse(body)
    const membro = await makeMembroService().atualizar(id, igrejaId, dto)
    return NextResponse.json(MembroResponseDto.from(membro))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string

    const membroAtual = await makeMembroService().buscarPorId(membroId, igrejaId)
    if (membroAtual.perfil !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Apenas administradores podem inativar membros" }, { status: 403 })
    }

    await makeMembroService().inativar(id, igrejaId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
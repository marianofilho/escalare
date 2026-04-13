// src/app/api/membros/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { AtualizarMembroSchema } from "@/dtos/membro/criar-membro.dto"
import { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import { makeMembroService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membro = await makeMembroService().buscarPorId(id, igrejaId)
    return NextResponse.json(MembroResponseDto.from(membro))
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
    const body = await request.json()
    const dto = AtualizarMembroSchema.parse(body)

    const membro = await makeMembroService().atualizar(id, igrejaId, dto)
    return NextResponse.json(MembroResponseDto.from(membro))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    await makeMembroService().inativar(id, igrejaId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
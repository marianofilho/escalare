// src/app/api/cultos/[id]/inscricoes/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { InscricaoCultoSchema } from "@/dtos/culto/criar-culto.dto"
import { makeCultoService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: cultoId } = await params

    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string
    const body = await request.json()
    const dto = InscricaoCultoSchema.parse(body)

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
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string

    await makeCultoService().cancelarInscricao(cultoId, igrejaId, membroId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
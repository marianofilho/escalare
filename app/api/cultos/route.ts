// src/app/api/cultos/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { CriarCultoSchema } from "@/dtos/culto/criar-culto.dto"
import { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import { makeCultoService, makeMembroService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") ?? undefined
    const futuros = searchParams.get("futuros") === "true"

    const cultos = await makeCultoService().listar(igrejaId, { status, futuros })
    return NextResponse.json(cultos.map(CultoResponseDto.from))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string

    // Verifica perfil no banco
    const membroAtual = await makeMembroService().buscarPorId(membroId, igrejaId)
    if (membroAtual.perfil !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Apenas administradores podem cadastrar cultos" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const dto = CriarCultoSchema.parse(body)

    const culto = await makeCultoService().criar(dto, igrejaId)
    return NextResponse.json(CultoResponseDto.from(culto), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
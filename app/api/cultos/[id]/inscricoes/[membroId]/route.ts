// src/app/api/cultos/[id]/inscricoes/[membroId]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { makeCultoService, makeMembroService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string; membroId: string }>
}

export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: cultoId, membroId: membroIdAlvo } = await params

    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const membroId = user.user_metadata?.membroId as string

    // Verifica que e admin
    const membro = await makeMembroService().buscarPorId(membroId, igrejaId)
    if (membro.perfil !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Apenas administradores podem cancelar inscricoes de outros membros" },
        { status: 403 }
      )
    }

    await makeCultoService().cancelarInscricaoComoAdmin(cultoId, igrejaId, membroIdAlvo)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
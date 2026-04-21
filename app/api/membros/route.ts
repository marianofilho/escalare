// src/app/api/membros/route.ts — apenas o GET atualizado com paginação
// (manter o POST existente sem alteração)
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { makeMembroService } from "@/lib/factories"
import { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import { handleApiError } from "@/lib/api-error-handler"
import { MembroRepository } from "@/repositories/membro.repository"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "ATIVO" | "INATIVO" | null
    const perfil = searchParams.get("perfil") ?? undefined
    const paginaParam = searchParams.get("pagina")

    const repo = new MembroRepository()

    // Com paginação
    if (paginaParam) {
      const pagina = Math.max(1, parseInt(paginaParam, 10) || 1)
      const resultado = await repo.listarPaginado(
        igrejaId,
        { ...(status ? { status } : {}), ...(perfil ? { perfil } : {}) },
        pagina
      )
      return NextResponse.json({
        ...resultado,
        data: resultado.data.map(MembroResponseDto.from),
      })
    }

    // Sem paginação — compatibilidade retroativa
    const membros = await makeMembroService().listar(igrejaId, {
      ...(status ? { status } : {}),
      ...(perfil ? { perfil } : {}),
    })
    return NextResponse.json(membros.map(MembroResponseDto.from))
  } catch (error) {
    return handleApiError(error)
  }
}
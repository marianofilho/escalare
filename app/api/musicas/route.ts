// src/app/api/musicas/route.ts — GET atualizado com paginação
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { CriarMusicaSchema } from "@/dtos/musica/criar-musica.dto"
import { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import { makeMusicaService } from "@/lib/factories"
import { MusicaRepository } from "@/repositories/musica.repository"
import { handleApiError } from "@/lib/api-error-handler"
import { resolveSession } from "@/lib/resolve-session"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") ?? undefined
    const busca = searchParams.get("busca") ?? undefined
    const paginaParam = searchParams.get("pagina")

    const repo = new MusicaRepository()

    // Com paginação
    if (paginaParam) {
      const pagina = Math.max(1, parseInt(paginaParam, 10) || 1)
      const resultado = await repo.listarPaginado(igrejaId, { status, busca }, pagina)
      return NextResponse.json({
        ...resultado,
        data: resultado.data.map(MusicaResponseDto.from),
      })
    }

    // Sem paginação — compatibilidade retroativa
    const musicas = await makeMusicaService().listar(igrejaId, { status, busca })
    return NextResponse.json(musicas.map(MusicaResponseDto.from))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const resolved = await resolveSession(session)
    if (!resolved) return NextResponse.json({ error: "Membro não encontrado" }, { status: 403 })

    const { igrejaId, membroId } = resolved

    const body: unknown = await request.json()
    const dto = CriarMusicaSchema.parse(body)

    const musica = await makeMusicaService().criar(dto, igrejaId, membroId)
    return NextResponse.json(MusicaResponseDto.from(musica), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
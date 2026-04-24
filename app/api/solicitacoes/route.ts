// src/app/api/solicitacoes/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeSolicitacaoService } from "@/lib/factories"
import { CriarSolicitacaoSchema } from "@/dtos/solicitacao/solicitacao.dto"
import { handleApiError } from "@/lib/api-error-handler"
import { resolveSession } from "@/lib/resolve-session"

// GET — admin lista pendentes / cantor lista as suas
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string
    const perfil = session.user.user_metadata?.perfil as string

    const service = makeSolicitacaoService()

    if (perfil === "ADMINISTRADOR") {
      const pendentes = await service.listarPendentes(igrejaId, membroId)
      return NextResponse.json(pendentes)
    }

    const minhas = await service.listarMinhas(membroId, igrejaId)
    return NextResponse.json(minhas)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST — cantor cria solicitação
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const resolved = await resolveSession(session)
    if (!resolved) return NextResponse.json({ error: "Membro não encontrado" }, { status: 403 })

    const { igrejaId, membroId } = resolved

    const body: unknown = await request.json()
    const dto = CriarSolicitacaoSchema.parse(body)

    const solicitacao = await makeSolicitacaoService().solicitar(dto, membroId, igrejaId)
    return NextResponse.json(solicitacao, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
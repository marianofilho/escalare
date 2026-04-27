// src/app/api/cultos/route.ts — GET atualizado com paginação
import { NextResponse } from "next/server"
import { createSupabaseServerClient, getServerSession } from "@/lib/supabase-server"
import { CriarCultoSchema } from "@/dtos/culto/criar-culto.dto"
import { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import { makeCultoService, makeMembroService } from "@/lib/factories"
import { makeEmailService } from "@/services/email.service"
import { MembroRepository } from "@/repositories/membro.repository"
import { IgrejaRepository } from "@/repositories/igreja.repository"
import { CultoRepository } from "@/repositories/culto.repository"
import { handleApiError } from "@/lib/api-error-handler"
import { resolveSession } from "@/lib/resolve-session"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") ?? undefined
    const futuros = searchParams.get("futuros") === "true"
    const paginaParam = searchParams.get("pagina")

    const repo = new CultoRepository()

    // Com paginação
    if (paginaParam) {
      const pagina = Math.max(1, parseInt(paginaParam, 10) || 1)
      const resultado = await repo.listarPaginado(igrejaId, { status, futuros }, pagina)
      return NextResponse.json({
        ...resultado,
        data: resultado.data.map(CultoResponseDto.from),
      })
    }

    // Sem paginação — compatibilidade retroativa
    const cultos = await makeCultoService().listar(igrejaId, { status, futuros })
    return NextResponse.json(cultos.map(CultoResponseDto.from))
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
    const cultoDto = CultoResponseDto.from(culto)

    if (dto.inscricoesAbertas !== false) {
      notificarMembros({
        igrejaId,
        cultoId: culto.id,
        tipoCulto: culto.tipo,
        subtipo: culto.subtipo,
        dataHoraInicio: culto.dataHoraInicio.toISOString(),
      }).catch((err) =>
        console.error("[POST /api/cultos] Erro ao notificar membros:", err)
      )
    }

    return NextResponse.json(cultoDto, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

async function notificarMembros(params: {
  igrejaId: string
  cultoId: string
  tipoCulto: string
  subtipo: string | null
  dataHoraInicio: string
}): Promise<void> {
  const membroRepo = new MembroRepository()
  const igrejaRepo = new IgrejaRepository()
  const [membros, nomeIgreja] = await Promise.all([
    membroRepo.listarPorIgreja(params.igrejaId, { status: "ATIVO" }),
    igrejaRepo.findNome(params.igrejaId),
  ])
  if (membros.length === 0 || !nomeIgreja) return
  const { enviados, erros } = await makeEmailService().notificarEscala({
    membros: membros.map((m) => ({ nome: m.nome, email: m.email })),
    nomeIgreja,
    tipoCulto: params.tipoCulto,
    subtipo: params.subtipo,
    dataHoraInicio: params.dataHoraInicio,
    cultoId: params.cultoId,
  })
  console.log(`[POST /api/cultos] Notificacoes: ${enviados} enviadas, ${erros} erros`)
}
// src/app/api/cultos/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { CriarCultoSchema } from "@/dtos/culto/criar-culto.dto"
import { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import { makeCultoService, makeMembroService } from "@/lib/factories"
import { makeEmailService } from "@/services/email.service"
import { MembroRepository } from "@/repositories/membro.repository"
import { IgrejaRepository } from "@/repositories/igreja.repository"
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
    const cultoDto = CultoResponseDto.from(culto)

    // Dispara notificações em background — não bloqueia a resposta
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
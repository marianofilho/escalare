// src/app/(dashboard)/repertorio/[cultoId]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect, notFound } from "next/navigation"
import { makeRepertorioService, makeCultoService, makeMusicaService } from "@/lib/factories"
import { authService } from "@/services/auth.service"
import { RepertorioResponseDto } from "@/dtos/repertorio/repertorio-response.dto"
import { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import { NaoEncontradoError } from "@/types/errors"
import { prisma } from "@/lib/prisma"
import RepertorioEditor from "@/components/repertorio/RepertorioEditor"
import Link from "next/link"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"

interface Props {
  params: Promise<{ cultoId: string }>
}

export default async function RepertorioEditorPage({ params }: Props) {
  const { cultoId } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string

  let perfil = session.user.user_metadata?.perfil as string | undefined
  if (!perfil) {
    const usuario = await authService.me(session.user.id)
    perfil = usuario.perfil
  }
  const isAdmin = perfil === "ADMINISTRADOR"

  try {
    const culto = await makeCultoService().buscarPorId(cultoId, igrejaId)

    // Busca as inscrições com o perfil do membro para identificar o cantor
    const inscricoesComPerfil = await prisma.inscricaoCulto.findMany({
      where: { cultoId },
      include: { membro: { select: { id: true, perfil: true } } },
    })

    // Cantor escalado = membro inscrito com perfil CANTOR
    const inscricaoCantor = inscricoesComPerfil.find(
      (i) => i.membro.perfil === "CANTOR"
    )
    const cantorIdDoRepertorio = inscricaoCantor?.membroId ?? null

    // Permissão: admin ou o próprio cantor inscrito
    const isCantorEscalado = perfil === "CANTOR" &&
      inscricoesComPerfil.some((i) => i.membroId === membroId)

    if (!isAdmin && !isCantorEscalado) redirect("/repertorio")

    const repertorioRaw = await makeRepertorioService().buscarPorCulto(cultoId, igrejaId)
    const repertorio = repertorioRaw ? RepertorioResponseDto.from(repertorioRaw) : null

    const todasMusicas = cantorIdDoRepertorio
      ? await makeMusicaService().listar(igrejaId, { status: "ATIVA" })
      : []

    const musicasDoCantor = todasMusicas
      .filter((m) => m.cantores.some((mc) => mc.cantorId === cantorIdDoRepertorio))
      .map(MusicaResponseDto.from)

    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/repertorio" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mt-2">
            {formatarTipoCulto(culto.tipo)}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">{formatarDataHora(culto.dataHoraInicio)}</p>
          {!cantorIdDoRepertorio && (
            <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-2 text-sm">
              Nenhum cantor inscrito neste culto. Um membro com perfil{" "}
              <strong>Cantor</strong> precisa se inscrever antes de criar o repertório.
            </div>
          )}
        </div>

        <RepertorioEditor
          cultoId={cultoId}
          cantorId={cantorIdDoRepertorio ?? ""}
          repertorio={repertorio}
          musicasDisponiveis={musicasDoCantor}
        />
      </div>
    )
  } catch (error) {
    if (error instanceof NaoEncontradoError) notFound()
    throw error
  }
}
// src/app/(dashboard)/repertorio/[cultoId]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect, notFound } from "next/navigation"
import { makeRepertorioService, makeCultoService, makeMusicaService, makeMembroService } from "@/lib/factories"
import { RepertorioMapper } from "@/dtos/repertorio/repertorio-response.dto"
import { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import { NaoEncontradoError } from "@/types/errors"
import RepertorioEditor from "@/components/repertorio/RepertorioEditor"
import Link from "next/link"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"

export const dynamic = "force-dynamic"

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

  // Busca perfil no banco — fonte de verdade
  const membro = await makeMembroService().buscarPorId(membroId, igrejaId)
  const perfil = membro.perfil
  const isAdmin = perfil === "ADMINISTRADOR"

  try {
    const culto = await makeCultoService().buscarPorId(cultoId, igrejaId)

    // Filtra cantores que NÃO marcaram comoInstrumentista
    const inscricaoCantor = culto.inscricoes.find(
      (i) => i.membro.perfil === "CANTOR" && !i.comoInstrumentista
    )
    const cantorIdDoRepertorio = inscricaoCantor?.membroId ?? null

    // Permissão: admin ou cantor inscrito
    const isCantorInscrito = perfil === "CANTOR" &&
      culto.inscricoes.some((i) => i.membroId === membroId)

    if (!isAdmin && !isCantorInscrito) redirect("/repertorio")

    const repertorioRaw = await makeRepertorioService().buscarPorCulto(cultoId, igrejaId)
    const repertorio = repertorioRaw ? RepertorioMapper.from(repertorioRaw) : null

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
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mt-2">
            {formatarTipoCulto(culto.tipo)}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">{formatarDataHora(culto.dataHoraInicio)}</p>
          {!cantorIdDoRepertorio && (
            <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-2 text-sm">
              Nenhum cantor inscrito para cantar neste culto. Um membro com perfil{" "}
              <strong>Cantor</strong> precisa se inscrever (sem marcar &quot;participar so como instrumentista&quot;)
              antes de criar o repertorio.
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
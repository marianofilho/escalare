// src/app/(dashboard)/repertorio/[cultoId]/estudar/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect, notFound } from "next/navigation"
import { makeRepertorioService, makeCultoService } from "@/lib/factories"
import { RepertorioMapper } from "@/dtos/repertorio/repertorio-response.dto"
import { NaoEncontradoError } from "@/types/errors"
import EstudoPlayer from "@/components/repertorio/EstudoPlayer"
import BotaoExportarPDF from "@/components/repertorio/BotaoExportarPDF"
import Link from "next/link"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ cultoId: string }>
}

export default async function EstudarPage({ params }: Props) {
  const { cultoId } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string

  try {
    const culto = await makeCultoService().buscarPorId(cultoId, igrejaId)
    const repertorioRaw = await makeRepertorioService().buscarPorCulto(cultoId, igrejaId)

    if (!repertorioRaw) redirect(`/repertorio/${cultoId}`)

    const repertorio = RepertorioMapper.from(repertorioRaw)

    const inscricao = culto.inscricoes.find(
      (i: { membroId: string; instrumento: string }) => i.membroId === membroId
    )
    const instrumentoDoMembro = inscricao?.instrumento ?? null

    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link href="/repertorio" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
              ← Voltar
            </Link>
            <BotaoExportarPDF cultoId={cultoId} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mt-4">
            {formatarTipoCulto(culto.tipo)}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">{formatarDataHora(culto.dataHoraInicio)}</p>
          {instrumentoDoMembro && (
            <p className="text-sm text-violet-600 font-medium mt-1">
              Seu instrumento: {instrumentoDoMembro}
            </p>
          )}
        </div>

        <EstudoPlayer
          repertorio={repertorio}
          instrumentoDoMembro={instrumentoDoMembro}
        />
      </div>
    )
  } catch (error) {
    if (error instanceof NaoEncontradoError) notFound()
    throw error
  }
}
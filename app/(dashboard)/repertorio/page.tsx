// src/app/(dashboard)/repertorio/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { makeRepertorioService } from "@/lib/factories"
import RepertorioLista from "@/components/repertorio/RepertorioLista"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"
import type { CultoComRepertorioDto } from "@/dtos/repertorio/repertorio-response.dto"

export const dynamic = "force-dynamic"

function mapearCulto(
  c: Awaited<ReturnType<ReturnType<typeof makeRepertorioService>["listarCultosDoMembro"]>>[number]
): CultoComRepertorioDto {
  return {
    cultoId: c.id,
    cultoTipo: formatarTipoCulto(c.tipo),
    cultoData: formatarDataHora(c.dataHoraInicio),
    cantorNome: c.repertorio?.cantor?.nome ?? null,
    temRepertorio: Boolean(c.repertorio),
    totalMusicas: c.repertorio?.itens.length ?? 0,
    membroEscalado: c.inscricoes.length > 0,
    instrumento: c.inscricoes[0]?.instrumento ?? null,
  }
}

export default async function RepertorioPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string

  const repertorioService = makeRepertorioService()

  const [cultos, historico] = await Promise.all([
    repertorioService.listarCultosDoMembro(igrejaId, membroId),
    repertorioService.listarHistoricoDoMembro(igrejaId, membroId),
  ])

  const cultosDto = cultos.map(mapearCulto)
  const historicoDto = historico.map(mapearCulto)

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Repertorio</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Cultos em que voce esta escalado
        </p>
      </div>

      <RepertorioLista cultos={cultosDto} historico={historicoDto} />
    </div>
  )
}
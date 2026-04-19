// src/app/(dashboard)/repertorio/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { makeRepertorioService } from "@/lib/factories"
import RepertorioLista from "@/components/repertorio/RepertorioLista"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"
import type { CultoComRepertorioDto } from "@/dtos/repertorio/repertorio-response.dto"

export default async function RepertorioPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string

  const cultos = await makeRepertorioService().listarCultosDoMembro(igrejaId, membroId)

  const cultosDto: CultoComRepertorioDto[] = cultos.map((c) => ({
    cultoId: c.id,
    cultoTipo: formatarTipoCulto(c.tipo),
    cultoData: formatarDataHora(c.dataHoraInicio),
    cantorNome: c.repertorio?.cantor?.nome ?? null,
    temRepertorio: Boolean(c.repertorio),
    totalMusicas: c.repertorio?.itens.length ?? 0,
    membroEscalado: c.inscricoes.length > 0,
    instrumento: c.inscricoes[0]?.instrumento ?? null,
  }))

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Repertório</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Cultos em que você está escalado
        </p>
      </div>
      <RepertorioLista cultos={cultosDto} />
    </div>
  )
}
// src/app/(dashboard)/admin/solicitacoes/page.tsx
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeSolicitacaoService, makeMembroService } from "@/lib/factories"
import SolicitacoesLista from "@/components/solicitacoes/SolicitacoesLista"

export const dynamic = "force-dynamic"

export default async function SolicitacoesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string

  // Busca perfil no banco — fonte de verdade
  const membro = await makeMembroService().buscarPorId(membroId, igrejaId)
  if (membro.perfil !== "ADMINISTRADOR") redirect("/")

  const pendentes = await makeSolicitacaoService().listarPendentes(igrejaId, membroId)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Solicitacoes de vinculo</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Cantores que pediram para ser vinculados a musicas do catalogo.
        </p>
      </div>
      <SolicitacoesLista inicial={pendentes} />
    </main>
  )
}
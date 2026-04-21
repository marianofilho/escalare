// src/app/(dashboard)/cultos/page.tsx
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { makeMembroService } from "@/lib/factories"
import CultoLista from "@/components/cultos/CultoLista"

export const dynamic = "force-dynamic"

export default async function CultosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string

  // Busca perfil no banco — fonte de verdade
  const membro = await makeMembroService().buscarPorId(membroId, igrejaId)
  const isAdmin = membro.perfil === "ADMINISTRADOR"
  const isCantor = membro.perfil === "CANTOR"

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Cultos</h1>
            <p className="text-sm text-zinc-400 mt-0.5">Escalas e inscricoes do ministerio</p>
          </div>
          {isAdmin && (
            <Link
              href="/cultos/novo"
              className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              + Novo culto
            </Link>
          )}
        </div>
        <CultoLista isAdmin={isAdmin} isCantor={isCantor} membroId={membroId} />
      </div>
    </div>
  )
}
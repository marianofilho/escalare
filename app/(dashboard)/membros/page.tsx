// src/app/(dashboard)/membros/page.tsx
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { makeMembroService } from "@/lib/factories"
import { resolveSession } from "@/lib/resolve-session"
import MembroLista from "@/components/membros/MembroLista"

export default async function MembrosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const resolved = await resolveSession(session)
  console.log("[membros/page] resolved:", resolved)

  if (!resolved) redirect("/login")

  const { igrejaId, membroId } = resolved

  const service = makeMembroService()
  const membroAtual = await service.buscarPorId(membroId, igrejaId)
  const isAdmin = membroAtual.perfil === "ADMINISTRADOR"
  
  console.log("[membros/page] membroAtual:", membroAtual)
 console.log("[membros/page] isAdmin:", isAdmin)

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Membros</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Gerencie os integrantes do ministério
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/membros/novo"
              className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              + Novo membro
            </Link>
          )}
        </div>
        <MembroLista isAdmin={isAdmin} />
      </div>
    </div>
  )
}
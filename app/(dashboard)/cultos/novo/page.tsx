// src/app/(dashboard)/cultos/novo/page.tsx
import Link from "next/link"
import { getServerSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { makeMembroService } from "@/lib/factories"
import CultoForm from "@/components/cultos/CultoForm"

export default async function NovoCultoPage() {
  const user = await getServerSession()
  if (!user) redirect("/login")

  const igrejaId = user.user_metadata?.igrejaId as string
  const membroId = user.user_metadata?.membroId as string

  const service = makeMembroService()
  const membroAtual = await service.buscarPorId(membroId, igrejaId)
  if (membroAtual.perfil !== "ADMINISTRADOR") redirect("/cultos")

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/cultos" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            ← Voltar para cultos
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mt-2">Novo culto</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Configure os dados da escala</p>
        </div>
        <CultoForm />
      </div>
    </div>
  )
}
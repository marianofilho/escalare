// src/app/(dashboard)/perfil/page.tsx
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeMembroService } from "@/lib/factories"
import { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import PerfilForm from "@/components/perfil/PerfilForm"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string

  const membro = await makeMembroService().buscarPorId(membroId, igrejaId)
  const membroDto = MembroResponseDto.from(membro)

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Meu perfil</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Atualize suas informações pessoais e de contato.
        </p>
      </div>
      <PerfilForm membro={membroDto} igrejaId={igrejaId} />
    </main>
  )
}
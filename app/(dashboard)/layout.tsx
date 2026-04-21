// src/app/(dashboard)/layout.tsx
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { makeMembroService } from "@/lib/factories"
import NavBar from "@/components/dashboard/NavBar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string
  const nomeMembro = session.user.user_metadata?.nome as string | undefined
  const fotoPerfil = session.user.user_metadata?.fotoPerfil as string | undefined

  // Busca perfil no banco — fonte de verdade
  const membro = await makeMembroService().buscarPorId(membroId, igrejaId)
  const isAdmin = membro.perfil === "ADMINISTRADOR"

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavBar
        nomeMembro={nomeMembro ?? membro.nome}
        fotoPerfil={fotoPerfil ?? membro.fotoPerfil}
        isAdmin={isAdmin}
      />
      <div>{children}</div>
    </div>
  )
}
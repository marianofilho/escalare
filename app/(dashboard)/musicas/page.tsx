// src/app/(dashboard)/musicas/page.tsx
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { authService } from "@/services/auth.service"
import MusicaLista from "@/components/musicas/MusicaLista"

export default async function MusicasPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  // user_metadata.perfil é preenchido no login pelo auth.service
  // Fallback para busca no banco caso o metadata ainda seja antigo (ex: sessão anterior ao deploy)
  let perfil = session.user.user_metadata?.perfil as string | undefined
  if (!perfil) {
    const usuario = await authService.me(session.user.id)
    perfil = usuario.perfil
  }

  const isAdmin = perfil === "ADMINISTRADOR"

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Músicas</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Catálogo de músicas do ministério</p>
        </div>
        {isAdmin && (
          <Link href="/musicas/nova"
            className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
            + Nova música
          </Link>
        )}
      </div>
      <MusicaLista isAdmin={isAdmin} />
    </div>
  )
}
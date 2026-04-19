// src/app/(dashboard)/musicas/nova/page.tsx
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { authService } from "@/services/auth.service"
import MusicaForm from "@/components/musicas/MusicaForm"

export default async function NovaMusicaPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  let perfil = session.user.user_metadata?.perfil as string | undefined
  if (!perfil) {
    const usuario = await authService.me(session.user.id)
    perfil = usuario.perfil
  }

  if (perfil !== "ADMINISTRADOR") redirect("/musicas")

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link href="/musicas" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
          ← Voltar para músicas
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">Nova música</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Preencha os dados da música. Cantores e faixas podem ser vinculados após o cadastro.
        </p>
      </div>
      <MusicaForm />
    </div>
  )
}
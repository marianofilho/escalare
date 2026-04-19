// src/app/(dashboard)/musicas/[id]/editar/page.tsx
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect, notFound } from "next/navigation"
import { authService } from "@/services/auth.service"
import { makeMusicaService } from "@/lib/factories"
import { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import { NaoEncontradoError } from "@/types/errors"
import MusicaForm from "@/components/musicas/MusicaForm"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarMusicaPage({ params }: Props) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  let perfil = session.user.user_metadata?.perfil as string | undefined
  if (!perfil) {
    const usuario = await authService.me(session.user.id)
    perfil = usuario.perfil
  }

  if (perfil !== "ADMINISTRADOR") redirect("/musicas")

  const igrejaId = session.user.user_metadata?.igrejaId as string

  try {
    const musica = await makeMusicaService().buscarPorId(id, igrejaId)
    const musicaDto = MusicaResponseDto.from(musica)

    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/musicas" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            ← Voltar para músicas
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mt-2">Editar música</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{musica.titulo}</p>
        </div>
        <MusicaForm musica={musicaDto} />
      </div>
    )
  } catch (error) {
    if (error instanceof NaoEncontradoError) notFound()
    throw error
  }
}
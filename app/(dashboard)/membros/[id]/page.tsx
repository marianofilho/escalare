// src/app/(dashboard)/membros/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeMembroService } from "@/lib/factories"
import { NaoEncontradoError } from "@/types/errors"
import MembroDetalhe from "@/components/membros/MembroDetalhe"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MembroDetalhePage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroLogadoId = session.user.user_metadata?.membroId as string

  // Busca perfil no banco — fonte de verdade
  const membroLogado = await makeMembroService().buscarPorId(membroLogadoId, igrejaId)
  const isAdmin = membroLogado.perfil === "ADMINISTRADOR"
  const isMinhaConta = membroLogadoId === id

  // Qualquer membro pode ver o perfil de outro (somente leitura)
  try {
    const perfil = await makeMembroService().buscarPerfilCompleto(id, igrejaId)
    return (
      <MembroDetalhe
        membro={perfil}
        isAdmin={isAdmin}
        isMinhaConta={isMinhaConta}
      />
    )
  } catch (error) {
    if (error instanceof NaoEncontradoError) notFound()
    throw error
  }
}
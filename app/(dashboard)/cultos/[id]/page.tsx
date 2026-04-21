// src/app/(dashboard)/cultos/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeCultoService, makeMembroService, makeRepertorioService } from "@/lib/factories"
import { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import CultoDetalhe from "@/components/cultos/CultoDetalhe"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CultoDetalhePage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string

  // Busca perfil no banco — fonte de verdade
  const membro = await makeMembroService().buscarPorId(membroId, igrejaId)
  const isAdmin = membro.perfil === "ADMINISTRADOR"
  const isCantor = membro.perfil === "CANTOR"

  let culto
  try {
    culto = await makeCultoService().buscarPorId(id, igrejaId)
  } catch {
    notFound()
  }

  const cultoDto = CultoResponseDto.from(culto)

  const repertorioService = makeRepertorioService()
  const repertorioRaw = await repertorioService.buscarPorCulto(id, igrejaId)

  const repertorio = repertorioRaw
    ? {
        id: repertorioRaw.id,
        cantorNome: repertorioRaw.cantor.nome,
        totalMusicas: repertorioRaw.itens.length,
      }
    : null

  // Admin busca lista de membros ativos para inscrever
  let membrosDisponiveis: MembroResponseDto[] = []
  if (isAdmin) {
    const membros = await makeMembroService().listar(igrejaId, { status: "ATIVO" })
    membrosDisponiveis = membros.map(MembroResponseDto.from)
  }

  return (
    <CultoDetalhe
      culto={cultoDto}
      repertorio={repertorio}
      membroId={membroId}
      isAdmin={isAdmin}
      isCantor={isCantor}
      membrosDisponiveis={membrosDisponiveis}
    />
  )
}
// src/app/(dashboard)/cultos/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeCultoService, makeRepertorioService } from "@/lib/factories"
import { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import CultoDetalhe from "@/components/cultos/CultoDetalhe"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CultoDetalhePage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const membroId = session.user.user_metadata?.membroId as string
  const perfil = session.user.user_metadata?.perfil as string
  const isAdmin = perfil === "ADMINISTRADOR"

  const cultoService = makeCultoService()
  let culto
  try {
    culto = await cultoService.buscarPorId(id, igrejaId)
  } catch {
    notFound()
  }

  const cultoDto = CultoResponseDto.from(culto)

  // Busca o repertório via RepertorioService — sem prisma direto na page
  const repertorioService = makeRepertorioService()
  const repertorioRaw = await repertorioService.buscarPorCulto(id, igrejaId)

  const repertorio = repertorioRaw
    ? {
        id: repertorioRaw.id,
        cantorNome: repertorioRaw.cantor.nome,
        totalMusicas: repertorioRaw.itens.length,
      }
    : null

  return (
    <CultoDetalhe
      culto={cultoDto}
      repertorio={repertorio}
      membroId={membroId}
      isAdmin={isAdmin}
    />
  )
}
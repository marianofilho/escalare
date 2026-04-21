// src/app/(dashboard)/repertorio/[cultoId]/imprimir/page.tsx
import { notFound, redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeRepertorioService, makeCultoService } from "@/lib/factories"
import { RepertorioResponseDto } from "@/dtos/repertorio/repertorio-response.dto"
import { NaoEncontradoError } from "@/types/errors"
import ImprimirRepertorio from "@/components/repertorio/ImprimirRepertorio"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ cultoId: string }>
}

export default async function ImprimirRepertorioPage({ params }: Props) {
  const { cultoId } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string

  try {
    const [culto, repertorioRaw] = await Promise.all([
      makeCultoService().buscarPorId(cultoId, igrejaId),
      makeRepertorioService().buscarPorCulto(cultoId, igrejaId),
    ])

    if (!repertorioRaw) notFound()

    const repertorio = RepertorioResponseDto.from(repertorioRaw)
    const tituloCulto = formatarTipoCulto(culto.tipo)
    const dataCulto = formatarDataHora(culto.dataHoraInicio)

    return (
      <ImprimirRepertorio
        repertorio={repertorio}
        tituloCulto={tituloCulto}
        dataCulto={dataCulto}
        voltarHref={`/repertorio/${cultoId}/estudar`}
      />
    )
  } catch (error) {
    if (error instanceof NaoEncontradoError) notFound()
    throw error
  }
}
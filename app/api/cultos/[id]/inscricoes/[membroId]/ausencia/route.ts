// src/app/api/cultos/[id]/inscricoes/[membroId]/ausencia/route.ts
import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeCultoService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

const AusenciaSchema = z.object({
  ausente: z.boolean(),
})

interface RouteParams {
  params: Promise<{ id: string; membroId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: cultoId, membroId } = await params

    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const perfil = session.user.user_metadata?.perfil as string
    if (perfil !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Apenas administradores podem marcar ausência" }, { status: 403 })
    }

    const igrejaId = session.user.user_metadata?.igrejaId as string

    const body: unknown = await request.json()
    const { ausente } = AusenciaSchema.parse(body)

    const cultoService = makeCultoService()
    await cultoService.marcarAusente(cultoId, igrejaId, membroId, ausente)

    return NextResponse.json({ ok: true, ausente })
  } catch (error) {
    return handleApiError(error)
  }
}
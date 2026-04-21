// src/app/api/solicitacoes/[id]/recusar/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeSolicitacaoService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    await makeSolicitacaoService().recusar(id, membroId, igrejaId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
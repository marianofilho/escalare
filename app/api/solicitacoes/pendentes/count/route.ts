// src/app/api/solicitacoes/pendentes/count/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeSolicitacaoService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const perfil = session.user.user_metadata?.perfil as string

    if (perfil !== "ADMINISTRADOR") {
      return NextResponse.json({ total: 0 })
    }

    const total = await makeSolicitacaoService().contarPendentes(igrejaId)
    return NextResponse.json({ total })
  } catch (error) {
    return handleApiError(error)
  }
}
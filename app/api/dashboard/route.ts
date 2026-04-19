// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeDashboardService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string

    const dados = await makeDashboardService().buscarResumo(igrejaId)

    return NextResponse.json(dados)
  } catch (error) {
    return handleApiError(error)
  }
}
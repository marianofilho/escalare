// src/app/api/busca/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase-server"
import { makeBuscaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const igrejaId = user.user_metadata?.igrejaId as string
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") ?? ""

    const resultado = await makeBuscaService().buscar(igrejaId, q)
    return NextResponse.json(resultado)
  } catch (error) {
    return handleApiError(error)
  }
}
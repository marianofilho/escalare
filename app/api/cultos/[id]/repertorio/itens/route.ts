// src/app/api/cultos/[id]/repertorio/itens/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AdicionarItemSchema } from "@/dtos/repertorio/criar-repertorio.dto"
import { makeRepertorioService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/cultos/[id]/repertorio/itens — adiciona uma música ao repertório
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = AdicionarItemSchema.parse(body)

    const item = await makeRepertorioService().adicionarItem(id, igrejaId, membroId, dto)
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
// src/app/api/cultos/[id]/repertorio/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { CriarRepertorioSchema } from "@/dtos/repertorio/criar-repertorio.dto"
import { RepertorioResponseDto } from "@/dtos/repertorio/repertorio-response.dto"
import { makeRepertorioService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string

    const repertorio = await makeRepertorioService().buscarPorCulto(id, igrejaId)
    if (!repertorio) return NextResponse.json(null)

    return NextResponse.json(RepertorioResponseDto.from(repertorio))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = CriarRepertorioSchema.parse(body)

    const repertorio = await makeRepertorioService().criar(id, igrejaId, membroId, dto.cantorId)
    return NextResponse.json(RepertorioResponseDto.from(repertorio), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
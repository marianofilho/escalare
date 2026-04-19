// src/app/api/musicas/[id]/restaurar/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeMusicaService } from "@/lib/factories"
import { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import { handleApiError } from "@/lib/api-error-handler"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const musica = await makeMusicaService().restaurar(id, igrejaId, membroId)
    return NextResponse.json(MusicaResponseDto.from(musica))
  } catch (error) {
    return handleApiError(error)
  }
}
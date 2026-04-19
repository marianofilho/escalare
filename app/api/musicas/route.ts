// src/app/api/musicas/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { CriarMusicaSchema } from "@/dtos/musica/criar-musica.dto"
import { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import { makeMusicaService } from "@/lib/factories"
import { handleApiError } from "@/lib/api-error-handler"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") ?? undefined
    const busca = searchParams.get("busca") ?? undefined

    const musicas = await makeMusicaService().listar(igrejaId, { status, busca })
    return NextResponse.json(musicas.map(MusicaResponseDto.from))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = CriarMusicaSchema.parse(body)

    const musica = await makeMusicaService().criar(dto, igrejaId, membroId)
    return NextResponse.json(MusicaResponseDto.from(musica), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
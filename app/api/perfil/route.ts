// src/app/api/perfil/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeMembroService } from "@/lib/factories"
import { AtualizarPerfilSchema } from "@/dtos/membro/atualizar-perfil.dto"
import { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import { handleApiError } from "@/lib/api-error-handler"

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const membro = await makeMembroService().buscarPorId(membroId, igrejaId)
    return NextResponse.json(MembroResponseDto.from(membro))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const igrejaId = session.user.user_metadata?.igrejaId as string
    const membroId = session.user.user_metadata?.membroId as string

    const body: unknown = await request.json()
    const dto = AtualizarPerfilSchema.parse(body)

    // Salva no banco via service
    const membro = await makeMembroService().atualizar(membroId, igrejaId, dto)

    // Sincroniza nome e fotoPerfil no user_metadata do Supabase Auth
    // para que o layout.tsx leia os valores atualizados sem precisar de query extra
    const metadataAtualizado: Record<string, string> = {}
    if (dto.nome) metadataAtualizado.nome = dto.nome
    if (dto.fotoPerfil !== undefined) metadataAtualizado.fotoPerfil = dto.fotoPerfil ?? ""

    if (Object.keys(metadataAtualizado).length > 0) {
      await supabase.auth.updateUser({ data: metadataAtualizado })
    }

    return NextResponse.json(MembroResponseDto.from(membro))
  } catch (error) {
    return handleApiError(error)
  }
}
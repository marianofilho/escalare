import { NextResponse } from "next/server"
import { authService } from "@/services/auth.service"
import { getServerSession } from "@/lib/supabase-server"
import { NaoAutorizadoError, UsuarioNaoEncontradoError } from "@/types/errors"

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession()
    if (!session) {
      throw new NaoAutorizadoError()
    }

    const usuario = await authService.me(session.user.id)
    return NextResponse.json({ usuario }, { status: 200 })
  } catch (error) {
    if (error instanceof NaoAutorizadoError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof UsuarioNaoEncontradoError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("[GET /api/auth/me]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
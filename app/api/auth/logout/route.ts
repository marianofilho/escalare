import { NextResponse } from "next/server"
import { authService } from "@/services/auth.service"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    await authService.logout(supabase)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("[POST /api/auth/logout]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
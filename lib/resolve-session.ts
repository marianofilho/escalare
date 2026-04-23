// src/lib/resolve-session.ts
import { prisma } from "@/lib/prisma"
import type { Session } from "@supabase/supabase-js"

/**
 * Extrai igrejaId e membroId da sessão.
 * Fallback: busca no banco pelo supabaseId caso o JWT ainda não tenha os metadados.
 * Isso ocorre quando o token foi emitido antes do updateUser() (ex: cadastro sem re-login).
 */
export async function resolveSession(session: Session) {
  const meta = session.user.user_metadata

  let igrejaId = meta?.igrejaId as string | undefined
  let membroId = meta?.membroId as string | undefined

  if (!igrejaId || !membroId) {
    const membro = await prisma.membro.findUnique({
      where: { supabaseId: session.user.id },
      select: { id: true, igrejaId: true },
    })
    if (!membro) return null
    igrejaId = membro.igrejaId
    membroId = membro.id
  }

  return { igrejaId, membroId }
}
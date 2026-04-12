import { prisma } from "@/lib/prisma"
import type { Usuario, Igreja } from "@prisma/client"

export type UsuarioComIgreja = Usuario & { igreja: Igreja }

export class UsuarioRepository {
  async findBySupabaseId(supabaseId: string): Promise<UsuarioComIgreja | null> {
    return prisma.usuario.findUnique({
      where: { supabaseId },
      include: { igreja: true },
    })
  }

  async findByEmailEIgreja(email: string, igrejaId: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({
      where: { email_igrejaId: { email, igrejaId } },
    })
  }

  async findById(id: string, igrejaId: string): Promise<UsuarioComIgreja | null> {
    return prisma.usuario.findUnique({
      where: { id, igrejaId }, // sempre filtra por igrejaId
      include: { igreja: true },
    })
  }
}
// src/repositories/membro.repository.ts
import { prisma } from "@/lib/prisma"
import type { Membro, Igreja, PerfilMembro } from "@prisma/client"

export type MembroComIgreja = Membro & { igreja: Igreja }

interface CriarMembroData {
  supabaseId: string
  nome: string
  email: string
  perfil: PerfilMembro
  igrejaId: string
}

export class MembroRepository {
  async findBySupabaseId(supabaseId: string): Promise<MembroComIgreja | null> {
    return prisma.membro.findFirst({
      where: { supabaseId },
      include: { igreja: true },
    })
  }

  async findById(id: string, igrejaId: string): Promise<MembroComIgreja | null> {
    return prisma.membro.findUnique({
      where: { id, igrejaId },
      include: { igreja: true },
    })
  }

  async criar(data: CriarMembroData): Promise<Membro> {
    return prisma.membro.create({ data })
  }
}
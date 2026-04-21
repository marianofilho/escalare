// src/repositories/igreja.repository.ts
import { prisma } from "@/lib/prisma"

export class IgrejaRepository {
  async findById(id: string) {
    return prisma.igreja.findUnique({
      where: { id },
    })
  }

  async findNome(id: string): Promise<string | null> {
    const igreja = await prisma.igreja.findUnique({
      where: { id },
      select: { nome: true },
    })
    return igreja?.nome ?? null
  }
}
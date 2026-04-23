// src/repositories/igreja.repository.ts
import { prisma } from "@/lib/prisma"
import type { Igreja } from "@prisma/client"

export class IgrejaRepository {
  async findById(id: string): Promise<Igreja | null> {
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

  async findBySlug(slug: string): Promise<Igreja | null> {
    return prisma.igreja.findUnique({
      where: { slug },
    })
  }
}
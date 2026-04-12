import { prisma } from "@/lib/prisma"
import type { Igreja } from "@prisma/client"

export class IgrejaRepository {
  async findBySlug(slug: string): Promise<Igreja | null> {
    return prisma.igreja.findUnique({ where: { slug } })
  }

  async criar(data: { nome: string; slug: string }): Promise<Igreja> {
    return prisma.igreja.create({ data })
  }
}
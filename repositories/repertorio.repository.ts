// src/repositories/repertorio.repository.ts
import { prisma } from "@/lib/prisma"
import type { AdicionarItemDto, AtualizarItemDto } from "@/dtos/repertorio/criar-repertorio.dto"

const repertorioInclude = {
  cantor: { select: { id: true, nome: true } },
  itens: {
    include: {
      musica: {
        include: {
          cantores: {
            include: {
              faixas: { orderBy: { instrumento: "asc" as const } },
            },
          },
        },
      },
    },
  },
} as const

const cultoComRepertorioInclude = (membroId: string) => ({
  repertorio: {
    include: {
      cantor: { select: { nome: true } },
      itens: { select: { id: true } },
    },
  },
  inscricoes: {
    where: { membroId },
    select: { instrumento: true },
  },
}) as const

export class RepertorioRepository {
  async findByCulto(cultoId: string) {
    return prisma.repertorio.findUnique({
      where: { cultoId },
      include: repertorioInclude,
    })
  }

  async criar(cultoId: string, cantorId: string) {
    return prisma.repertorio.create({
      data: { cultoId, cantorId },
      include: repertorioInclude,
    })
  }

  async deletar(cultoId: string) {
    return prisma.repertorio.delete({ where: { cultoId } })
  }

  async findItem(itemId: string) {
    return prisma.itemRepertorio.findUnique({
      where: { id: itemId },
      include: { repertorio: true },
    })
  }

  async findItemPorMusica(repertorioId: string, musicaId: string) {
    return prisma.itemRepertorio.findUnique({
      where: { repertorioId_musicaId: { repertorioId, musicaId } },
    })
  }

  async adicionarItem(
    repertorioId: string,
    musicaId: string,
    tomUsado: string,
    dto: AdicionarItemDto
  ) {
    return prisma.itemRepertorio.create({
      data: {
        repertorioId,
        musicaId,
        tomUsado,
        ordem: dto.ordem ?? null,
        observacoes: dto.observacoes ?? null,
      },
    })
  }

  async atualizarItem(itemId: string, dto: AtualizarItemDto) {
    return prisma.itemRepertorio.update({
      where: { id: itemId },
      data: {
        ordem: dto.ordem ?? null,
        observacoes: dto.observacoes ?? null,
      },
    })
  }

  async removerItem(itemId: string) {
    return prisma.itemRepertorio.delete({ where: { id: itemId } })
  }

  // Próximos cultos + últimos 7 dias em que o membro está escalado
  async listarCultosComRepertorio(igrejaId: string, membroId: string) {
    return prisma.culto.findMany({
      where: {
        igrejaId,
        dataHoraInicio: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        inscricoes: { some: { membroId } },
      },
      orderBy: { dataHoraInicio: "asc" },
      include: cultoComRepertorioInclude(membroId),
    })
  }

  // Cultos realizados há mais de 7 dias em que o membro participou
  async listarHistorico(igrejaId: string, membroId: string) {
    return prisma.culto.findMany({
      where: {
        igrejaId,
        status: "REALIZADO",
        dataHoraInicio: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        inscricoes: { some: { membroId } },
      },
      orderBy: { dataHoraInicio: "desc" }, // mais recente primeiro
      include: cultoComRepertorioInclude(membroId),
    })
  }
}
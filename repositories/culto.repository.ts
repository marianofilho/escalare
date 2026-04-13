// src/repositories/culto.repository.ts
import { prisma } from "@/lib/prisma"
import type { CriarCultoDto, AtualizarCultoDto } from "@/dtos/culto/criar-culto.dto"

const inscricoesInclude = {
  inscricoes: {
    include: {
      membro: { select: { id: true, nome: true, fotoPerfil: true } },
    },
  },
} as const

export class CultoRepository {
  async findById(id: string, igrejaId: string) {
    return prisma.culto.findFirst({
      where: { id, igrejaId },
      include: { limites: true, ...inscricoesInclude },
    })
  }

  async listarPorIgreja(
    igrejaId: string,
    filtros?: { status?: string; futuros?: boolean }
  ) {
    return prisma.culto.findMany({
      where: {
        igrejaId,
        ...(filtros?.status ? { status: filtros.status as any } : {}),
        ...(filtros?.futuros ? { dataHoraInicio: { gte: new Date() } } : {}),
      },
      orderBy: { dataHoraInicio: "asc" },
      include: { limites: true, ...inscricoesInclude },
    })
  }

  async criar(data: CriarCultoDto & { igrejaId: string }) {
    const { limites, ...cultoData } = data
    return prisma.culto.create({
      data: {
        ...cultoData,
        igrejaId: data.igrejaId,
        dataHoraInicio: new Date(data.dataHoraInicio),
        dataHoraFim: data.dataHoraFim ? new Date(data.dataHoraFim) : undefined,
        limites: {
          create: limites.map((l) => ({
            instrumento: l.instrumento,
            limite: l.limite,
          })),
        },
      },
      include: { limites: true, ...inscricoesInclude },
    })
  }

  async atualizar(id: string, data: AtualizarCultoDto) {
    const { limites, ...cultoData } = data
    return prisma.$transaction(async (tx) => {
      if (limites) {
        await tx.limiteInstrumento.deleteMany({ where: { cultoId: id } })
        await tx.limiteInstrumento.createMany({
          data: limites.map((l) => ({ cultoId: id, instrumento: l.instrumento, limite: l.limite })),
        })
      }
      return tx.culto.update({
        where: { id },
        data: {
          ...cultoData,
          dataHoraInicio: cultoData.dataHoraInicio ? new Date(cultoData.dataHoraInicio) : undefined,
          dataHoraFim: cultoData.dataHoraFim ? new Date(cultoData.dataHoraFim) : undefined,
        },
        include: { limites: true, ...inscricoesInclude },
      })
    })
  }

  async inscrever(cultoId: string, membroId: string, instrumento: string, fazBacking: boolean) {
    return prisma.inscricaoCulto.create({
      data: { cultoId, membroId, instrumento, fazBacking },
      include: { membro: { select: { id: true, nome: true, fotoPerfil: true } } },
    })
  }

  async cancelarInscricao(cultoId: string, membroId: string) {
    return prisma.inscricaoCulto.delete({
      where: { membroId_cultoId: { membroId, cultoId } },
    })
  }

  async findInscricao(cultoId: string, membroId: string) {
    return prisma.inscricaoCulto.findUnique({
      where: { membroId_cultoId: { membroId, cultoId } },
    })
  }

  async contarInscritosPorInstrumento(cultoId: string, instrumento: string): Promise<number> {
    return prisma.inscricaoCulto.count({ where: { cultoId, instrumento } })
  }

  async marcarAusente(cultoId: string, membroId: string, ausente: boolean) {
    return prisma.inscricaoCulto.update({
      where: { membroId_cultoId: { membroId, cultoId } },
      data: { ausente },
    })
  }
}
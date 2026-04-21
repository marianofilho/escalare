// src/repositories/culto.repository.ts
import { prisma } from "@/lib/prisma"
import type { CriarCultoDto, AtualizarCultoDto } from "@/dtos/culto/criar-culto.dto"
import {
  ITENS_POR_PAGINA,
  calcularSkip,
  montarPaginacao,
  type PaginacaoDto,
} from "@/dtos/paginacao.dto"

const inscricoesInclude = {
  inscricoes: {
    include: {
      membro: { select: { id: true, nome: true, fotoPerfil: true, perfil: true } },
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
      where: this._where(igrejaId, filtros),
      orderBy: { dataHoraInicio: "asc" },
      include: { limites: true, ...inscricoesInclude },
    })
  }

  async listarPaginado(
    igrejaId: string,
    filtros?: { status?: string; futuros?: boolean },
    pagina = 1
  ): Promise<PaginacaoDto<any>> {
    const where = this._where(igrejaId, filtros)
    const porPagina = ITENS_POR_PAGINA
    const [data, total] = await prisma.$transaction([
      prisma.culto.findMany({
        where,
        orderBy: { dataHoraInicio: "asc" },
        skip: calcularSkip(pagina, porPagina),
        take: porPagina,
        include: { limites: true, ...inscricoesInclude },
      }),
      prisma.culto.count({ where }),
    ])
    return montarPaginacao(data, total, pagina, porPagina)
  }

  private _where(igrejaId: string, filtros?: { status?: string; futuros?: boolean }) {
    return {
      igrejaId,
      ...(filtros?.status ? { status: filtros.status as any } : {}),
      ...(filtros?.futuros ? { dataHoraInicio: { gte: new Date() } } : {}),
    }
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
          create: limites.map((l) => ({ instrumento: l.instrumento, limite: l.limite })),
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

  async inscrever(cultoId: string, membroId: string, instrumento: string, fazBacking: boolean, comoInstrumentista: boolean) {
    return prisma.inscricaoCulto.create({
      data: { cultoId, membroId, instrumento, fazBacking, comoInstrumentista },
      include: { membro: { select: { id: true, nome: true, fotoPerfil: true, perfil: true } } },
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
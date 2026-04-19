// src/repositories/dashboard.repository.ts
import { prisma } from "@/lib/prisma"
import type { ProximoCultoDto } from "@/dtos/dashboard/dashboard-response.dto"

export class DashboardRepository {
  async contarMembrosAtivos(igrejaId: string): Promise<number> {
    return prisma.membro.count({
      where: { igrejaId, status: "ATIVO" },
    })
  }

  async contarMusicasAtivas(igrejaId: string): Promise<number> {
    return prisma.musica.count({
      where: { igrejaId, status: "ATIVA" },
    })
  }

  async contarCultosNoMes(igrejaId: string): Promise<number> {
    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59)
    return prisma.culto.count({
      where: {
        igrejaId,
        dataHoraInicio: { gte: inicioMes, lte: fimMes },
      },
    })
  }

  async listarProximosCultos(igrejaId: string, limite: number): Promise<ProximoCultoDto[]> {
    const cultos = await prisma.culto.findMany({
      where: {
        igrejaId,
        dataHoraInicio: { gte: new Date() },
      },
      orderBy: { dataHoraInicio: "asc" },
      take: limite,
      include: {
        _count: { select: { inscricoes: true } },
      },
    })

    return cultos.map((c) => ({
      id: c.id,
      tipo: c.tipo,
      subtipo: c.subtipo,
      dataHoraInicio: c.dataHoraInicio.toISOString(),
      dataHoraFim: c.dataHoraFim?.toISOString() ?? null,
      status: c.status,
      inscricoesAbertas: c.inscricoesAbertas,
      totalInscritos: c._count.inscricoes,
    }))
  }
}
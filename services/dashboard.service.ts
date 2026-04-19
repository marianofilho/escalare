// src/services/dashboard.service.ts
import type { DashboardRepository } from "@/repositories/dashboard.repository"
import type { DashboardResponseDto } from "@/dtos/dashboard/dashboard-response.dto"

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async buscarResumo(igrejaId: string): Promise<DashboardResponseDto> {
    const [totalMembros, totalMusicas, totalCultosNoMes, proximosCultos] = await Promise.all([
      this.dashboardRepository.contarMembrosAtivos(igrejaId),
      this.dashboardRepository.contarMusicasAtivas(igrejaId),
      this.dashboardRepository.contarCultosNoMes(igrejaId),
      this.dashboardRepository.listarProximosCultos(igrejaId, 5),
    ])

    return { totalMembros, totalMusicas, totalCultosNoMes, proximosCultos }
  }
}
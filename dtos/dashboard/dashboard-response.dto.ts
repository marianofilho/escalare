// src/dtos/dashboard/dashboard-response.dto.ts

export interface ProximoCultoDto {
  id: string
  tipo: string
  subtipo: string | null
  dataHoraInicio: string
  dataHoraFim: string | null
  status: string
  inscricoesAbertas: boolean
  totalInscritos: number
}

export interface DashboardResponseDto {
  totalMembros: number
  totalMusicas: number
  totalCultosNoMes: number
  proximosCultos: ProximoCultoDto[]
}
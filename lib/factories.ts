// src/lib/factories.ts
import { CultoRepository } from "@/repositories/culto.repository"
import { CultoService } from "@/services/culto.service"
import { DashboardRepository } from "@/repositories/dashboard.repository"
import { DashboardService } from "@/services/dashboard.service"
import { MembroRepository } from "@/repositories/membro.repository"
import { MembroService } from "@/services/membro.service"
import { MusicaRepository } from "@/repositories/musica.repository"
import { MusicaService } from "@/services/musica.service"
import { RepertorioRepository } from "@/repositories/repertorio.repository"
import { RepertorioService } from "@/services/repertorio.service"
import { SolicitacaoRepository } from "@/repositories/solicitacao.repository"
import { SolicitacaoService } from "@/services/solicitacao.service"
import { BuscaRepository } from "@/repositories/busca.repository"
import { BuscaService } from "@/services/busca.service"

export function makeCultoService(): CultoService {
  return new CultoService(new CultoRepository())
}

export function makeDashboardService(): DashboardService {
  return new DashboardService(new DashboardRepository())
}

export function makeMembroService(): MembroService {
  return new MembroService(new MembroRepository())
}

export function makeMusicaService(): MusicaService {
  return new MusicaService(new MusicaRepository(), new MembroRepository())
}

export function makeRepertorioService(): RepertorioService {
  return new RepertorioService(
    new RepertorioRepository(),
    new CultoRepository(),
    new MusicaRepository(),
    new MembroRepository()
  )
}

export function makeSolicitacaoService(): SolicitacaoService {
  return new SolicitacaoService(
    new SolicitacaoRepository(),
    new MusicaRepository(),
    new MembroRepository()
  )
}

export function makeBuscaService(): BuscaService {
  return new BuscaService(new BuscaRepository())
}
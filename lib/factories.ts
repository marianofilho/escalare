// src/lib/factories.ts
import { CultoRepository } from "@/repositories/culto.repository"
import { CultoService } from "@/services/culto.service"
import { MembroRepository } from "@/repositories/membro.repository"
import { MembroService } from "@/services/membro.service"
import { MusicaRepository } from "@/repositories/musica.repository"
import { MusicaService } from "@/services/musica.service"
import { RepertorioRepository } from "@/repositories/repertorio.repository"
import { RepertorioService } from "@/services/repertorio.service"

export function makeCultoService(): CultoService {
  return new CultoService(new CultoRepository())
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
// src/lib/factories.ts
import { CultoRepository } from "@/repositories/culto.repository"
import { CultoService } from "@/services/culto.service"
import { MembroRepository } from "@/repositories/membro.repository"
import { MembroService } from "@/services/membro.service"

export function makeCultoService(): CultoService {
  return new CultoService(new CultoRepository())
}

export function makeMembroService(): MembroService {
  return new MembroService(new MembroRepository())
}
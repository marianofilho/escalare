// src/services/membro.service.ts
import type { MembroRepository } from "@/repositories/membro.repository"
import type { CriarMembroDto, AtualizarMembroDto } from "@/dtos/membro/criar-membro.dto"
import { MembroJaExisteError, NaoEncontradoError } from "@/types/errors"

export class MembroService {
  constructor(private readonly membroRepository: MembroRepository) {}

  async listar(
    igrejaId: string,
    filtros?: { status?: "ATIVO" | "INATIVO"; perfil?: string }
  ) {
    return this.membroRepository.listarPorIgreja(igrejaId, filtros)
  }

  async buscarPorId(id: string, igrejaId: string) {
    const membro = await this.membroRepository.findById(id, igrejaId)
    if (!membro) throw new NaoEncontradoError("Membro", id)
    return membro
  }

  async criar(dto: CriarMembroDto, igrejaId: string) {
    const existente = await this.membroRepository.findByEmail(dto.email, igrejaId)
    if (existente) throw new MembroJaExisteError(dto.email)
    return this.membroRepository.criar({ ...dto, igrejaId })
  }

  async atualizar(id: string, igrejaId: string, dto: AtualizarMembroDto) {
    const membro = await this.membroRepository.findById(id, igrejaId)
    if (!membro) throw new NaoEncontradoError("Membro", id)

    if (dto.email && dto.email !== membro.email) {
      const comMesmoEmail = await this.membroRepository.findByEmail(dto.email, igrejaId)
      if (comMesmoEmail) throw new MembroJaExisteError(dto.email)
    }

    return this.membroRepository.atualizar(id, igrejaId, dto)
  }

  async atualizarSupabaseId(id: string, igrejaId: string, supabaseId: string) {
    return this.membroRepository.atualizarSupabaseId(id, igrejaId, supabaseId)
  }

  async inativar(id: string, igrejaId: string) {
    const membro = await this.membroRepository.findById(id, igrejaId)
    if (!membro) throw new NaoEncontradoError("Membro", id)
    return this.membroRepository.inativar(id, igrejaId)
  }
}
// src/services/membro.service.ts
import type { MembroRepository } from "@/repositories/membro.repository"
import type { CriarMembroDto, AtualizarMembroDto } from "@/dtos/membro/criar-membro.dto"
import { NaoEncontradoError } from "@/types/errors"
import { MembroJaExisteError } from "@/types/errors"
import type { MembroPerfilResponseDto } from "@/dtos/membro/membro-perfil-response.dto"

const TIPO_LABEL: Record<string, string> = {
  CULTO_DOMINGO_MANHA: "Culto Domingo Manha",
  CULTO_DOMINGO_NOITE: "Culto Domingo Noite",
  CULTO_SEMANA: "Culto de Semana",
  ENSAIO: "Ensaio",
  SEMANA_ORACAO: "Semana de Oracao",
  ESPECIAL: "Culto Especial",
  OUTRO: "Outro",
}

export class MembroService {
  constructor(private readonly membroRepository: MembroRepository) {}

  async listar(igrejaId: string, filtros?: { status?: "ATIVO" | "INATIVO"; perfil?: string }) {
    return this.membroRepository.listarPorIgreja(igrejaId, filtros)
  }

  async buscarPorId(id: string, igrejaId: string) {
    const membro = await this.membroRepository.findById(id, igrejaId)
    if (!membro) throw new NaoEncontradoError("Membro", id)
    return membro
  }

  async buscarPerfilCompleto(id: string, igrejaId: string): Promise<MembroPerfilResponseDto> {
    const membro = await this.membroRepository.findByIdComHistorico(id, igrejaId)
    if (!membro) throw new NaoEncontradoError("Membro", id)

    return {
      id: membro.id,
      nome: membro.nome,
      email: membro.email,
      telefone: membro.telefone ?? null,
      fotoPerfil: membro.fotoPerfil ?? null,
      perfil: membro.perfil,
      instrumentoPrincipal: membro.instrumentoPrincipal ?? null,
      instrumentoSecundario: membro.instrumentoSecundario ?? null,
      fazBackingVocal: membro.fazBackingVocal,
      status: membro.status,
      dataIngresso: membro.dataIngresso?.toISOString() ?? null,
      criadoEm: membro.criadoEm.toISOString(),
      totalCultos: membro.inscricoes.length,
      cultosRecentes: membro.inscricoes.map((i) => ({
        cultoId: i.culto.id,
        tipo: TIPO_LABEL[i.culto.tipo] ?? i.culto.tipo,
        subtipo: i.culto.subtipo ?? null,
        dataHoraInicio: i.culto.dataHoraInicio.toISOString(),
        status: i.culto.status,
        instrumento: i.instrumento,
        fazBacking: i.fazBacking,
        ausente: i.ausente,
      })),
      musicasVinculadas: membro.tomsCantor.map((mc) => ({
        musicaId: mc.musica.id,
        titulo: mc.musica.titulo,
        artista: mc.musica.artista ?? null,
        tom: mc.tom,
        statusMusica: mc.musica.status,
      })),
    }
  }

  async criar(dto: CriarMembroDto, igrejaId: string) {
    const existe = await this.membroRepository.findByEmail(dto.email, igrejaId)
    if (existe) throw new MembroJaExisteError(dto.email)
    return this.membroRepository.criar({ ...dto, igrejaId })
  }

  async atualizar(id: string, igrejaId: string, dto: AtualizarMembroDto) {
    const membro = await this.membroRepository.findById(id, igrejaId)
    if (!membro) throw new NaoEncontradoError("Membro", id)
    if (dto.email && dto.email !== membro.email) {
      const existe = await this.membroRepository.findByEmail(dto.email, igrejaId)
      if (existe) throw new MembroJaExisteError(dto.email)
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
// src/services/musica.service.ts
import type { MusicaRepository } from "@/repositories/musica.repository"
import type { MembroRepository } from "@/repositories/membro.repository"
import type {
  CriarMusicaDto,
  AtualizarMusicaDto,
  VincularCantorDto,
  AtualizarCantorDto,
  CriarFaixaDto,
  AtualizarFaixaDto,
} from "@/dtos/musica/criar-musica.dto"
import { NaoEncontradoError, AcessoNegadoError } from "@/types/errors"
import {
  MusicaJaExisteError,
  CantorJaVinculadoError,
  CantorNaoVinculadoError,
  PerfilInvalidoParaCantorError,
} from "@/types/musica-errors"

export class MusicaService {
  constructor(
    private readonly musicaRepository: MusicaRepository,
    private readonly membroRepository: MembroRepository
  ) {}

  private async exigirAdmin(membroId: string, igrejaId: string): Promise<void> {
    const membro = await this.membroRepository.findById(membroId, igrejaId)
    if (!membro || membro.perfil !== "ADMINISTRADOR") throw new AcessoNegadoError()
  }

  // --- Musica ---

  async listar(igrejaId: string, filtros?: { status?: string; busca?: string }) {
    return this.musicaRepository.listarPorIgreja(igrejaId, filtros)
  }

  async buscarPorId(id: string, igrejaId: string) {
    const musica = await this.musicaRepository.findById(id, igrejaId)
    if (!musica) throw new NaoEncontradoError("Música", id)
    return musica
  }

  async criar(dto: CriarMusicaDto, igrejaId: string, membroId: string) {
    await this.exigirAdmin(membroId, igrejaId)
    const existente = await this.musicaRepository.findByTitulo(dto.titulo, igrejaId)
    if (existente) throw new MusicaJaExisteError(dto.titulo)
    return this.musicaRepository.criar({ ...dto, igrejaId })
  }

  async atualizar(id: string, igrejaId: string, dto: AtualizarMusicaDto, membroId: string) {
    await this.exigirAdmin(membroId, igrejaId)
    const musica = await this.musicaRepository.findById(id, igrejaId)
    if (!musica) throw new NaoEncontradoError("Música", id)
    if (dto.titulo && dto.titulo !== musica.titulo) {
      const existente = await this.musicaRepository.findByTitulo(dto.titulo, igrejaId)
      if (existente) throw new MusicaJaExisteError(dto.titulo)
    }
    return this.musicaRepository.atualizar(id, dto)
  }

  async arquivar(id: string, igrejaId: string, membroId: string) {
    await this.exigirAdmin(membroId, igrejaId)
    const musica = await this.musicaRepository.findById(id, igrejaId)
    if (!musica) throw new NaoEncontradoError("Música", id)
    return this.musicaRepository.arquivar(id)
  }

  // --- MusicaCantor ---

  async vincularCantor(musicaId: string, igrejaId: string, membroId: string, dto: VincularCantorDto) {
    await this.exigirAdmin(membroId, igrejaId)
    const musica = await this.musicaRepository.findById(musicaId, igrejaId)
    if (!musica) throw new NaoEncontradoError("Música", musicaId)
    const cantor = await this.membroRepository.findById(dto.cantorId, igrejaId)
    if (!cantor) throw new NaoEncontradoError("Membro", dto.cantorId)
    if (cantor.perfil !== "CANTOR") throw new PerfilInvalidoParaCantorError()
    const jaVinculado = await this.musicaRepository.findVinculo(musicaId, dto.cantorId)
    if (jaVinculado) throw new CantorJaVinculadoError()
    return this.musicaRepository.vincularCantor(musicaId, dto)
  }

  async atualizarVinculo(
    musicaId: string,
    igrejaId: string,
    cantorId: string,
    dto: AtualizarCantorDto,
    membroId: string
  ) {
    await this.exigirAdmin(membroId, igrejaId)
    const musica = await this.musicaRepository.findById(musicaId, igrejaId)
    if (!musica) throw new NaoEncontradoError("Música", musicaId)
    const vinculo = await this.musicaRepository.findVinculo(musicaId, cantorId)
    if (!vinculo) throw new CantorNaoVinculadoError()
    return this.musicaRepository.atualizarVinculo(musicaId, cantorId, dto)
  }

  async removerVinculo(musicaId: string, igrejaId: string, cantorId: string, membroId: string) {
    await this.exigirAdmin(membroId, igrejaId)
    const musica = await this.musicaRepository.findById(musicaId, igrejaId)
    if (!musica) throw new NaoEncontradoError("Música", musicaId)
    const vinculo = await this.musicaRepository.findVinculo(musicaId, cantorId)
    if (!vinculo) throw new CantorNaoVinculadoError()
    return this.musicaRepository.removerVinculo(musicaId, cantorId)
  }

  // --- MusicaFaixa ---

  async adicionarFaixa(
    musicaId: string,
    cantorId: string,
    igrejaId: string,
    membroId: string,
    dto: CriarFaixaDto
  ) {
    await this.exigirAdmin(membroId, igrejaId)
    const vinculo = await this.musicaRepository.findVinculo(musicaId, cantorId)
    if (!vinculo) throw new CantorNaoVinculadoError()
    return this.musicaRepository.adicionarFaixa(vinculo.id, dto)
  }

  async atualizarFaixa(
    faixaId: string,
    igrejaId: string,
    membroId: string,
    dto: AtualizarFaixaDto
  ) {
    await this.exigirAdmin(membroId, igrejaId)
    const faixa = await this.musicaRepository.findFaixa(faixaId)
    if (!faixa) throw new NaoEncontradoError("Faixa", faixaId)
    return this.musicaRepository.atualizarFaixa(faixaId, dto)
  }

  async removerFaixa(faixaId: string, igrejaId: string, membroId: string) {
    await this.exigirAdmin(membroId, igrejaId)
    const faixa = await this.musicaRepository.findFaixa(faixaId)
    if (!faixa) throw new NaoEncontradoError("Faixa", faixaId)
    return this.musicaRepository.removerFaixa(faixaId)
  }
}
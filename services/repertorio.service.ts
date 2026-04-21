// src/services/repertorio.service.ts
import type { RepertorioRepository } from "@/repositories/repertorio.repository"
import type { CultoRepository } from "@/repositories/culto.repository"
import type { MusicaRepository } from "@/repositories/musica.repository"
import type { MembroRepository } from "@/repositories/membro.repository"
import type { AdicionarItemDto, AtualizarItemDto } from "@/dtos/repertorio/criar-repertorio.dto"
import { NaoEncontradoError } from "@/types/errors"
import {
  RepertorioJaExisteError,
  MusicaJaNoRepertorioError,
  CultoSemCantorError,
  SemPermissaoRepertorioError,
  MusicaSemTomError,
} from "@/types/repertorio-errors"

export class RepertorioService {
  constructor(
    private readonly repertorioRepository: RepertorioRepository,
    private readonly cultoRepository: CultoRepository,
    private readonly musicaRepository: MusicaRepository,
    private readonly membroRepository: MembroRepository
  ) {}

  private async exigirPermissao(
    membroId: string,
    igrejaId: string,
    cantorIdDoRepertorio: string
  ): Promise<void> {
    const membro = await this.membroRepository.findById(membroId, igrejaId)
    if (!membro) throw new NaoEncontradoError("Membro", membroId)
    const isAdmin = membro.perfil === "ADMINISTRADOR"
    const isCantorEscalado = membroId === cantorIdDoRepertorio
    if (!isAdmin && !isCantorEscalado) throw new SemPermissaoRepertorioError()
  }

  async buscarPorCulto(cultoId: string, igrejaId: string) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)
    return this.repertorioRepository.findByCulto(cultoId)
  }

  async criar(cultoId: string, igrejaId: string, membroId: string, cantorId: string) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)
    if (!cantorId) throw new CultoSemCantorError()
    await this.exigirPermissao(membroId, igrejaId, cantorId)
    const existente = await this.repertorioRepository.findByCulto(cultoId)
    if (existente) throw new RepertorioJaExisteError()
    return this.repertorioRepository.criar(cultoId, cantorId)
  }

  async adicionarItem(cultoId: string, igrejaId: string, membroId: string, dto: AdicionarItemDto) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)
    const repertorio = await this.repertorioRepository.findByCulto(cultoId)
    if (!repertorio) throw new NaoEncontradoError("Repertorio", cultoId)
    await this.exigirPermissao(membroId, igrejaId, repertorio.cantorId)
    const jaExiste = await this.repertorioRepository.findItemPorMusica(repertorio.id, dto.musicaId)
    if (jaExiste) throw new MusicaJaNoRepertorioError()
    const musica = await this.musicaRepository.findById(dto.musicaId, igrejaId)
    if (!musica) throw new NaoEncontradoError("Musica", dto.musicaId)
    const vincCantor = musica.cantores.find((mc) => mc.cantorId === repertorio.cantorId)
    if (!vincCantor) throw new MusicaSemTomError(musica.titulo)
    return this.repertorioRepository.adicionarItem(repertorio.id, dto.musicaId, vincCantor.tom, dto)
  }

  async atualizarItem(
    cultoId: string,
    itemId: string,
    igrejaId: string,
    membroId: string,
    dto: AtualizarItemDto
  ) {
    const repertorio = await this.repertorioRepository.findByCulto(cultoId)
    if (!repertorio) throw new NaoEncontradoError("Repertorio", cultoId)
    await this.exigirPermissao(membroId, igrejaId, repertorio.cantorId)
    const item = await this.repertorioRepository.findItem(itemId)
    if (!item) throw new NaoEncontradoError("Item", itemId)
    return this.repertorioRepository.atualizarItem(itemId, dto)
  }

  async removerItem(cultoId: string, itemId: string, igrejaId: string, membroId: string) {
    const repertorio = await this.repertorioRepository.findByCulto(cultoId)
    if (!repertorio) throw new NaoEncontradoError("Repertorio", cultoId)
    await this.exigirPermissao(membroId, igrejaId, repertorio.cantorId)
    const item = await this.repertorioRepository.findItem(itemId)
    if (!item) throw new NaoEncontradoError("Item", itemId)
    return this.repertorioRepository.removerItem(itemId)
  }

  async listarCultosDoMembro(igrejaId: string, membroId: string) {
    return this.repertorioRepository.listarCultosComRepertorio(igrejaId, membroId)
  }

  async listarHistoricoDoMembro(igrejaId: string, membroId: string) {
    return this.repertorioRepository.listarHistorico(igrejaId, membroId)
  }
}
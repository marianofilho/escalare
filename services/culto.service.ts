// src/services/culto.service.ts
import type { CultoRepository } from "@/repositories/culto.repository"
import type { CriarCultoDto, AtualizarCultoDto, InscricaoCultoDto } from "@/dtos/culto/criar-culto.dto"
import { NaoEncontradoError } from "@/types/errors"
import {
  CultoFechadoError,
  InstrumentoLotadoError,
  MembroJaInscritoError,
  PrazoCancelamentoError,
} from "@/types/culto-errors"

export class CultoService {
  constructor(private readonly cultoRepository: CultoRepository) {}

  async listar(igrejaId: string, filtros?: { status?: string; futuros?: boolean }) {
    return this.cultoRepository.listarPorIgreja(igrejaId, filtros)
  }

  async buscarPorId(id: string, igrejaId: string) {
    const culto = await this.cultoRepository.findById(id, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", id)
    return culto
  }

  async criar(dto: CriarCultoDto, igrejaId: string) {
    return this.cultoRepository.criar({ ...dto, igrejaId })
  }

  async atualizar(id: string, igrejaId: string, dto: AtualizarCultoDto) {
    const culto = await this.cultoRepository.findById(id, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", id)
    return this.cultoRepository.atualizar(id, dto)
  }

  // Inscricao normal — membro se inscreve por conta propria
  async inscrever(cultoId: string, igrejaId: string, membroId: string, dto: InscricaoCultoDto) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)

    if (!culto.inscricoesAbertas || culto.status !== "ABERTO") {
      throw new CultoFechadoError()
    }

    const jaInscrito = await this.cultoRepository.findInscricao(cultoId, membroId)
    if (jaInscrito) throw new MembroJaInscritoError()

    await this._verificarLimite(cultoId, dto.instrumento, culto.limites)

    return this.cultoRepository.inscrever(
      cultoId,
      membroId,
      dto.instrumento,
      dto.fazBacking,
      dto.comoInstrumentista ?? false
    )
  }

  // Inscricao pelo admin — bypassa restricoes de status e inscricoes abertas
  async inscreverComoAdmin(
    cultoId: string,
    igrejaId: string,
    membroIdAlvo: string,
    dto: InscricaoCultoDto
  ) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)

    // Admin pode inscrever mesmo com culto fechado ou inscricoes encerradas
    // mas nao pode inscrever alguem ja inscrito
    const jaInscrito = await this.cultoRepository.findInscricao(cultoId, membroIdAlvo)
    if (jaInscrito) throw new MembroJaInscritoError()

    await this._verificarLimite(cultoId, dto.instrumento, culto.limites)

    return this.cultoRepository.inscrever(
      cultoId,
      membroIdAlvo,
      dto.instrumento,
      dto.fazBacking,
      dto.comoInstrumentista ?? false
    )
  }

  async cancelarInscricao(cultoId: string, igrejaId: string, membroId: string) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)

    const inscricao = await this.cultoRepository.findInscricao(cultoId, membroId)
    if (!inscricao) throw new NaoEncontradoError("Inscricao", `${membroId}/${cultoId}`)

    const agora = new Date()
    const inicioMs = culto.dataHoraInicio.getTime()
    const prazoMs = culto.prazoCancelamentoHoras * 60 * 60 * 1000
    if (agora.getTime() > inicioMs - prazoMs) {
      throw new PrazoCancelamentoError(culto.prazoCancelamentoHoras)
    }

    return this.cultoRepository.cancelarInscricao(cultoId, membroId)
  }

  // Admin cancela inscricao de qualquer membro sem restricao de prazo
  async cancelarInscricaoComoAdmin(cultoId: string, igrejaId: string, membroIdAlvo: string) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)

    const inscricao = await this.cultoRepository.findInscricao(cultoId, membroIdAlvo)
    if (!inscricao) throw new NaoEncontradoError("Inscricao", `${membroIdAlvo}/${cultoId}`)

    return this.cultoRepository.cancelarInscricao(cultoId, membroIdAlvo)
  }

  async marcarAusente(cultoId: string, igrejaId: string, membroId: string, ausente: boolean) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)
    return this.cultoRepository.marcarAusente(cultoId, membroId, ausente)
  }

  private async _verificarLimite(
    cultoId: string,
    instrumento: string,
    limites: { instrumento: string; limite: number }[]
  ) {
    const limiteInstrumento = limites.find((l) => l.instrumento === instrumento)
    if (limiteInstrumento) {
      const inscritos = await this.cultoRepository.contarInscritosPorInstrumento(cultoId, instrumento)
      if (inscritos >= limiteInstrumento.limite) {
        throw new InstrumentoLotadoError(instrumento)
      }
    }
  }
}
// src/services/culto.service.ts
import type { CultoRepository } from "@/repositories/culto.repository"
import type { CriarCultoDto, AtualizarCultoDto, InscricaoCultoDto } from "@/dtos/culto/criar-culto.dto"
import {
  NaoEncontradoError,
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

  async inscrever(cultoId: string, igrejaId: string, membroId: string, dto: InscricaoCultoDto) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)

    if (!culto.inscricoesAbertas || culto.status !== "ABERTO") {
      throw new CultoFechadoError()
    }

    const jaInscrito = await this.cultoRepository.findInscricao(cultoId, membroId)
    if (jaInscrito) throw new MembroJaInscritoError()

    // Verifica limite de instrumento se houver regra definida
    const limiteInstrumento = culto.limites.find((l) => l.instrumento === dto.instrumento)
    if (limiteInstrumento) {
      const inscritos = await this.cultoRepository.contarInscritosPorInstrumento(
        cultoId,
        dto.instrumento
      )
      if (inscritos >= limiteInstrumento.limite) {
        throw new InstrumentoLotadoError(dto.instrumento)
      }
    }

    return this.cultoRepository.inscrever(cultoId, membroId, dto.instrumento, dto.fazBacking)
  }

  async cancelarInscricao(cultoId: string, igrejaId: string, membroId: string) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)

    const inscricao = await this.cultoRepository.findInscricao(cultoId, membroId)
    if (!inscricao) throw new NaoEncontradoError("Inscrição", `${membroId}/${cultoId}`)

    // Verifica prazo de cancelamento
    const agora = new Date()
    const inicioMs = culto.dataHoraInicio.getTime()
    const prazoMs = culto.prazoCancelamentoHoras * 60 * 60 * 1000
    if (agora.getTime() > inicioMs - prazoMs) {
      throw new PrazoCancelamentoError(culto.prazoCancelamentoHoras)
    }

    return this.cultoRepository.cancelarInscricao(cultoId, membroId)
  }

  async marcarAusente(cultoId: string, igrejaId: string, membroId: string, ausente: boolean) {
    const culto = await this.cultoRepository.findById(cultoId, igrejaId)
    if (!culto) throw new NaoEncontradoError("Culto", cultoId)
    return this.cultoRepository.marcarAusente(cultoId, membroId, ausente)
  }
}
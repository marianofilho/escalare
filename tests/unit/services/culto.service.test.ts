// tests/unit/services/culto.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CultoService } from "@/services/culto.service"
import { NaoEncontradoError } from "@/types/errors"
import {
  CultoFechadoError,
  MembroJaInscritoError,
  InstrumentoLotadoError,
  PrazoCancelamentoError,
} from "@/types/culto-errors"
import type { CultoRepository } from "@/repositories/culto.repository"

// ── helpers ──────────────────────────────────────────────────────────────────

function makeCulto(overrides = {}) {
  return {
    id: "culto-1",
    igrejaId: "igreja-1",
    tipo: "CULTO_DOMINGO_MANHA" as const,
    subtipo: null,
    dataHoraInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias no futuro
    dataHoraFim: null,
    cantorId: null,
    status: "ABERTO" as const,
    inscricoesAbertas: true,
    prazoCancelamentoHoras: 48,
    repetirSemanal: false,
    observacoesInternas: null,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    limites: [],
    inscricoes: [],
    ...overrides,
  }
}

function makeRepo() {
  return {
    findById: vi.fn(),
    listarPorIgreja: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    inscrever: vi.fn(),
    cancelarInscricao: vi.fn(),
    findInscricao: vi.fn(),
    contarInscritosPorInstrumento: vi.fn(),
    marcarAusente: vi.fn(),
  } as unknown as jest.Mocked<CultoRepository>
}

// ── testes ────────────────────────────────────────────────────────────────────

describe("CultoService", () => {
  let repo: ReturnType<typeof makeRepo>
  let service: CultoService

  beforeEach(() => {
    repo = makeRepo()
    service = new CultoService(repo)
  })

  describe("buscarPorId", () => {
    it("retorna o culto quando encontrado", async () => {
      const culto = makeCulto()
      repo.findById.mockResolvedValue(culto)

      const result = await service.buscarPorId("culto-1", "igreja-1")

      expect(result).toEqual(culto)
    })

    it("lança NaoEncontradoError quando culto não existe", async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.buscarPorId("inexistente", "igreja-1"))
        .rejects.toThrow(NaoEncontradoError)
    })
  })

  describe("inscrever", () => {
    const dto = { instrumento: "Violao", fazBacking: false, comoInstrumentista: false }

    it("inscreve com sucesso quando culto aberto e membro não inscrito", async () => {
      const culto = makeCulto()
      repo.findById.mockResolvedValue(culto)
      repo.findInscricao.mockResolvedValue(null)
      const inscricao = { id: "inscricao-1", membroId: "membro-1", cultoId: "culto-1", ...dto }
      repo.inscrever.mockResolvedValue(inscricao)

      const result = await service.inscrever("culto-1", "igreja-1", "membro-1", dto)

      expect(result).toEqual(inscricao)
      expect(repo.inscrever).toHaveBeenCalledWith("culto-1", "membro-1", "Violao", false, false)
    })

    it("lança CultoFechadoError quando culto não está ABERTO", async () => {
      repo.findById.mockResolvedValue(makeCulto({ status: "FECHADO" }))

      await expect(service.inscrever("culto-1", "igreja-1", "membro-1", dto))
        .rejects.toThrow(CultoFechadoError)
    })

    it("lança CultoFechadoError quando inscrições estão fechadas", async () => {
      repo.findById.mockResolvedValue(makeCulto({ inscricoesAbertas: false }))

      await expect(service.inscrever("culto-1", "igreja-1", "membro-1", dto))
        .rejects.toThrow(CultoFechadoError)
    })

    it("lança MembroJaInscritoError quando membro já inscrito", async () => {
      repo.findById.mockResolvedValue(makeCulto())
      repo.findInscricao.mockResolvedValue({ id: "inscricao-existente" })

      await expect(service.inscrever("culto-1", "igreja-1", "membro-1", dto))
        .rejects.toThrow(MembroJaInscritoError)
    })

    it("lança InstrumentoLotadoError quando limite atingido", async () => {
      const culto = makeCulto({
        limites: [{ instrumento: "Violao", limite: 1 }],
      })
      repo.findById.mockResolvedValue(culto)
      repo.findInscricao.mockResolvedValue(null)
      repo.contarInscritosPorInstrumento.mockResolvedValue(1) // já tem 1, limite é 1

      await expect(service.inscrever("culto-1", "igreja-1", "membro-1", dto))
        .rejects.toThrow(InstrumentoLotadoError)
    })

    it("inscreve mesmo com limite quando instrumento diferente do limitado", async () => {
      const culto = makeCulto({
        limites: [{ instrumento: "Guitarra", limite: 1 }],
      })
      repo.findById.mockResolvedValue(culto)
      repo.findInscricao.mockResolvedValue(null)
      repo.inscrever.mockResolvedValue({ id: "inscricao-1" })

      // Violao não tem limite definido — deve inscrever normalmente
      await service.inscrever("culto-1", "igreja-1", "membro-1", dto)

      expect(repo.inscrever).toHaveBeenCalled()
    })
  })

  describe("cancelarInscricao", () => {
    it("cancela quando dentro do prazo", async () => {
      const culto = makeCulto({ prazoCancelamentoHoras: 48 })
      repo.findById.mockResolvedValue(culto)
      repo.findInscricao.mockResolvedValue({ id: "inscricao-1" })
      repo.cancelarInscricao.mockResolvedValue(undefined)

      await service.cancelarInscricao("culto-1", "igreja-1", "membro-1")

      expect(repo.cancelarInscricao).toHaveBeenCalledWith("culto-1", "membro-1")
    })

    it("lança PrazoCancelamentoError quando fora do prazo", async () => {
      // Culto começa em 1 hora, prazo é 48h — não pode cancelar
      const culto = makeCulto({
        dataHoraInicio: new Date(Date.now() + 1 * 60 * 60 * 1000),
        prazoCancelamentoHoras: 48,
      })
      repo.findById.mockResolvedValue(culto)
      repo.findInscricao.mockResolvedValue({ id: "inscricao-1" })

      await expect(service.cancelarInscricao("culto-1", "igreja-1", "membro-1"))
        .rejects.toThrow(PrazoCancelamentoError)
    })

    it("lança NaoEncontradoError quando inscrição não existe", async () => {
      repo.findById.mockResolvedValue(makeCulto())
      repo.findInscricao.mockResolvedValue(null)

      await expect(service.cancelarInscricao("culto-1", "igreja-1", "membro-1"))
        .rejects.toThrow(NaoEncontradoError)
    })
  })

  describe("marcarAusente", () => {
    it("marca ausência quando culto existe", async () => {
      repo.findById.mockResolvedValue(makeCulto())
      repo.marcarAusente.mockResolvedValue(undefined)

      await service.marcarAusente("culto-1", "igreja-1", "membro-1", true)

      expect(repo.marcarAusente).toHaveBeenCalledWith("culto-1", "membro-1", true)
    })
  })
})
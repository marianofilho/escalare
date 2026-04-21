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
    dataHoraInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    listarPaginado: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    inscrever: vi.fn().mockResolvedValue({ id: "inscricao-1" }),
    cancelarInscricao: vi.fn().mockResolvedValue(undefined),
    findInscricao: vi.fn(),
    contarInscritosPorInstrumento: vi.fn().mockResolvedValue(0),
    marcarAusente: vi.fn(),
  } as unknown as jest.Mocked<CultoRepository>
}

const dtoBase = { instrumento: "Violao", fazBacking: false, comoInstrumentista: false }

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
      expect(await service.buscarPorId("culto-1", "igreja-1")).toEqual(culto)
    })

    it("lanca NaoEncontradoError quando nao encontrado", async () => {
      repo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId("inexistente", "igreja-1")).rejects.toThrow(NaoEncontradoError)
    })
  })

  describe("inscrever", () => {
    it("inscreve com sucesso quando culto aberto e membro nao inscrito", async () => {
      repo.findById.mockResolvedValue(makeCulto())
      repo.findInscricao.mockResolvedValue(null)

      await service.inscrever("culto-1", "igreja-1", "membro-1", dtoBase)

      expect(repo.inscrever).toHaveBeenCalledWith("culto-1", "membro-1", "Violao", false, false)
    })

    it("lanca CultoFechadoError quando culto FECHADO", async () => {
      repo.findById.mockResolvedValue(makeCulto({ status: "FECHADO" }))
      await expect(service.inscrever("culto-1", "igreja-1", "membro-1", dtoBase)).rejects.toThrow(CultoFechadoError)
    })

    it("lanca CultoFechadoError quando inscricoes encerradas", async () => {
      repo.findById.mockResolvedValue(makeCulto({ inscricoesAbertas: false }))
      await expect(service.inscrever("culto-1", "igreja-1", "membro-1", dtoBase)).rejects.toThrow(CultoFechadoError)
    })

    it("lanca MembroJaInscritoError quando membro ja inscrito", async () => {
      repo.findById.mockResolvedValue(makeCulto())
      repo.findInscricao.mockResolvedValue({ id: "inscricao-existente" })
      await expect(service.inscrever("culto-1", "igreja-1", "membro-1", dtoBase)).rejects.toThrow(MembroJaInscritoError)
    })

    it("lanca InstrumentoLotadoError quando limite atingido", async () => {
      repo.findById.mockResolvedValue(makeCulto({ limites: [{ instrumento: "Violao", limite: 1 }] }))
      repo.findInscricao.mockResolvedValue(null)
      repo.contarInscritosPorInstrumento.mockResolvedValue(1)
      await expect(service.inscrever("culto-1", "igreja-1", "membro-1", dtoBase)).rejects.toThrow(InstrumentoLotadoError)
    })
  })

  describe("inscreverComoAdmin", () => {
    it("inscreve mesmo com culto FECHADO", async () => {
      repo.findById.mockResolvedValue(makeCulto({ status: "FECHADO" }))
      repo.findInscricao.mockResolvedValue(null)

      await service.inscreverComoAdmin("culto-1", "igreja-1", "membro-alvo", dtoBase)

      expect(repo.inscrever).toHaveBeenCalledWith("culto-1", "membro-alvo", "Violao", false, false)
    })

    it("inscreve mesmo com inscricoes encerradas", async () => {
      repo.findById.mockResolvedValue(makeCulto({ inscricoesAbertas: false }))
      repo.findInscricao.mockResolvedValue(null)

      await service.inscreverComoAdmin("culto-1", "igreja-1", "membro-alvo", dtoBase)

      expect(repo.inscrever).toHaveBeenCalled()
    })

    it("inscreve mesmo com culto REALIZADO", async () => {
      repo.findById.mockResolvedValue(makeCulto({ status: "REALIZADO" }))
      repo.findInscricao.mockResolvedValue(null)

      await service.inscreverComoAdmin("culto-1", "igreja-1", "membro-alvo", dtoBase)

      expect(repo.inscrever).toHaveBeenCalled()
    })

    it("lanca MembroJaInscritoError mesmo sendo admin", async () => {
      repo.findById.mockResolvedValue(makeCulto({ status: "FECHADO" }))
      repo.findInscricao.mockResolvedValue({ id: "inscricao-existente" })

      await expect(
        service.inscreverComoAdmin("culto-1", "igreja-1", "membro-alvo", dtoBase)
      ).rejects.toThrow(MembroJaInscritoError)
    })

    it("ainda respeita limite de instrumento", async () => {
      repo.findById.mockResolvedValue(makeCulto({
        status: "FECHADO",
        limites: [{ instrumento: "Violao", limite: 1 }],
      }))
      repo.findInscricao.mockResolvedValue(null)
      repo.contarInscritosPorInstrumento.mockResolvedValue(1)

      await expect(
        service.inscreverComoAdmin("culto-1", "igreja-1", "membro-alvo", dtoBase)
      ).rejects.toThrow(InstrumentoLotadoError)
    })

    it("usa o membroIdAlvo correto no inscrever", async () => {
      repo.findById.mockResolvedValue(makeCulto({ status: "FECHADO" }))
      repo.findInscricao.mockResolvedValue(null)

      await service.inscreverComoAdmin("culto-1", "igreja-1", "cantor-especifico", dtoBase)

      expect(repo.inscrever).toHaveBeenCalledWith(
        "culto-1", "cantor-especifico", "Violao", false, false
      )
    })
  })

  describe("cancelarInscricaoComoAdmin", () => {
    it("cancela inscricao sem verificar prazo", async () => {
      // Culto que ja passou do prazo de cancelamento normal
      const cultoPassado = makeCulto({
        dataHoraInicio: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1h no futuro
        prazoCancelamentoHoras: 48, // prazo de 48h — nao poderia cancelar normalmente
      })
      repo.findById.mockResolvedValue(cultoPassado)
      repo.findInscricao.mockResolvedValue({ id: "inscricao-1" })

      await service.cancelarInscricaoComoAdmin("culto-1", "igreja-1", "membro-alvo")

      expect(repo.cancelarInscricao).toHaveBeenCalledWith("culto-1", "membro-alvo")
    })

    it("lanca NaoEncontradoError quando inscricao nao existe", async () => {
      repo.findById.mockResolvedValue(makeCulto())
      repo.findInscricao.mockResolvedValue(null)

      await expect(
        service.cancelarInscricaoComoAdmin("culto-1", "igreja-1", "membro-alvo")
      ).rejects.toThrow(NaoEncontradoError)
    })
  })

  describe("cancelarInscricao", () => {
    it("cancela quando dentro do prazo", async () => {
      repo.findById.mockResolvedValue(makeCulto({ prazoCancelamentoHoras: 48 }))
      repo.findInscricao.mockResolvedValue({ id: "inscricao-1" })

      await service.cancelarInscricao("culto-1", "igreja-1", "membro-1")

      expect(repo.cancelarInscricao).toHaveBeenCalledWith("culto-1", "membro-1")
    })

    it("lanca PrazoCancelamentoError quando fora do prazo", async () => {
      repo.findById.mockResolvedValue(makeCulto({
        dataHoraInicio: new Date(Date.now() + 1 * 60 * 60 * 1000),
        prazoCancelamentoHoras: 48,
      }))
      repo.findInscricao.mockResolvedValue({ id: "inscricao-1" })

      await expect(service.cancelarInscricao("culto-1", "igreja-1", "membro-1"))
        .rejects.toThrow(PrazoCancelamentoError)
    })
  })

  describe("marcarAusente", () => {
    it("marca ausencia quando culto existe", async () => {
      repo.findById.mockResolvedValue(makeCulto())

      await service.marcarAusente("culto-1", "igreja-1", "membro-1", true)

      expect(repo.marcarAusente).toHaveBeenCalledWith("culto-1", "membro-1", true)
    })
  })
})
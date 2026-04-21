// tests/unit/services/busca.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { BuscaService } from "@/services/busca.service"
import type { BuscaRepository, ResultadoBusca } from "@/repositories/busca.repository"

// ── helpers ──────────────────────────────────────────────────────────────────

function makeResultadoVazio(): ResultadoBusca {
  return { membros: [], musicas: [], cultos: [] }
}

function makeResultado(overrides: Partial<ResultadoBusca> = {}): ResultadoBusca {
  return {
    membros: [{ id: "m1", nome: "Ana Silva", email: "ana@teste.com", perfil: "MUSICO", fotoPerfil: null }],
    musicas: [{ id: "mu1", titulo: "Grande e Forte", artista: "Zoe", status: "ATIVA" }],
    cultos: [{ id: "c1", tipo: "Culto Domingo Manha", subtipo: null, dataHoraInicio: new Date().toISOString(), status: "ABERTO" }],
    ...overrides,
  }
}

function makeRepo(): jest.Mocked<BuscaRepository> {
  return {
    buscar: vi.fn().mockResolvedValue(makeResultado()),
  } as unknown as jest.Mocked<BuscaRepository>
}

// ── testes ────────────────────────────────────────────────────────────────────

describe("BuscaService", () => {
  let repo: ReturnType<typeof makeRepo>
  let service: BuscaService

  beforeEach(() => {
    repo = makeRepo()
    service = new BuscaService(repo)
  })

  describe("buscar", () => {
    it("retorna vazio quando termo tem menos de 2 caracteres", async () => {
      const resultado = await service.buscar("igreja-1", "a")

      expect(resultado).toEqual({ membros: [], musicas: [], cultos: [] })
      expect(repo.buscar).not.toHaveBeenCalled()
    })

    it("retorna vazio para termo vazio", async () => {
      const resultado = await service.buscar("igreja-1", "")

      expect(resultado).toEqual({ membros: [], musicas: [], cultos: [] })
      expect(repo.buscar).not.toHaveBeenCalled()
    })

    it("retorna vazio para termo com apenas espacos", async () => {
      const resultado = await service.buscar("igreja-1", "   ")

      expect(resultado).toEqual({ membros: [], musicas: [], cultos: [] })
      expect(repo.buscar).not.toHaveBeenCalled()
    })

    it("chama o repository com termo de 2 caracteres", async () => {
      await service.buscar("igreja-1", "an")

      expect(repo.buscar).toHaveBeenCalledWith("igreja-1", "an")
    })

    it("chama o repository com termo longo", async () => {
      await service.buscar("igreja-1", "Ana Silva")

      expect(repo.buscar).toHaveBeenCalledWith("igreja-1", "Ana Silva")
    })

    it("remove espacos extras do termo antes de buscar", async () => {
      await service.buscar("igreja-1", "  ana  ")

      expect(repo.buscar).toHaveBeenCalledWith("igreja-1", "ana")
    })

    it("retorna os resultados do repository", async () => {
      const resultado = await service.buscar("igreja-1", "ana")

      expect(resultado.membros).toHaveLength(1)
      expect(resultado.membros[0].nome).toBe("Ana Silva")
      expect(resultado.musicas).toHaveLength(1)
      expect(resultado.cultos).toHaveLength(1)
    })

    it("passa o igrejaId correto para o repository", async () => {
      await service.buscar("outra-igreja", "teste")

      expect(repo.buscar).toHaveBeenCalledWith("outra-igreja", "teste")
    })
  })

  describe("temResultados", () => {
    it("retorna false para resultado vazio", () => {
      expect(service.temResultados(makeResultadoVazio())).toBe(false)
    })

    it("retorna true quando ha membros", () => {
      expect(service.temResultados(makeResultado({ musicas: [], cultos: [] }))).toBe(true)
    })

    it("retorna true quando ha musicas", () => {
      expect(service.temResultados(makeResultado({ membros: [], cultos: [] }))).toBe(true)
    })

    it("retorna true quando ha cultos", () => {
      expect(service.temResultados(makeResultado({ membros: [], musicas: [] }))).toBe(true)
    })

    it("retorna true quando ha resultados em todas as categorias", () => {
      expect(service.temResultados(makeResultado())).toBe(true)
    })
  })
})
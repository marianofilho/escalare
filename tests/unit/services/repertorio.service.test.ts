// tests/unit/services/repertorio.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { RepertorioService } from "@/services/repertorio.service"
import { NaoEncontradoError } from "@/types/errors"
import {
  RepertorioJaExisteError,
  MusicaJaNoRepertorioError,
  SemPermissaoRepertorioError,
  MusicaSemTomError,
} from "@/types/repertorio-errors"
import type { RepertorioRepository } from "@/repositories/repertorio.repository"
import type { CultoRepository } from "@/repositories/culto.repository"
import type { MusicaRepository } from "@/repositories/musica.repository"
import type { MembroRepository } from "@/repositories/membro.repository"

// ── helpers ──────────────────────────────────────────────────────────────────

function makeCulto(overrides = {}) {
  return { id: "culto-1", igrejaId: "igreja-1", tipo: "CULTO_DOMINGO_MANHA", status: "ABERTO", ...overrides }
}

function makeRepertorio(overrides = {}) {
  return {
    id: "rep-1", cultoId: "culto-1", cantorId: "cantor-1",
    cantor: { id: "cantor-1", nome: "Ana" },
    itens: [],
    criadoEm: new Date(), atualizadoEm: new Date(),
    ...overrides,
  }
}

function makeMembro(overrides = {}) {
  return {
    id: "admin-1", igrejaId: "igreja-1", perfil: "ADMINISTRADOR" as const,
    nome: "Admin", email: "admin@teste.com", supabaseId: null,
    telefone: null, fotoPerfil: null, instrumentoPrincipal: null,
    instrumentoSecundario: null, fazBackingVocal: false,
    status: "ATIVO" as const, dataIngresso: null,
    criadoEm: new Date(), atualizadoEm: new Date(),
    ...overrides,
  }
}

function makeMusica(overrides = {}) {
  return {
    id: "musica-1", igrejaId: "igreja-1", titulo: "Grande e Forte",
    artista: null, bpm: null, linkVideo: null, linkCifra: null,
    linkPartitura: null, status: "ATIVA" as const,
    criadoEm: new Date(), atualizadoEm: new Date(),
    cantores: [{ cantorId: "cantor-1", tom: "C", faixas: [] }],
    ...overrides,
  }
}

function makeRepos() {
  return {
    repertorioRepo: {
      findByCulto: vi.fn(),
      criar: vi.fn(),
      deletar: vi.fn(),
      findItem: vi.fn(),
      findItemPorMusica: vi.fn(),
      adicionarItem: vi.fn(),
      atualizarItem: vi.fn(),
      removerItem: vi.fn(),
      listarCultosComRepertorio: vi.fn(),
      listarHistorico: vi.fn(),
    } as unknown as jest.Mocked<RepertorioRepository>,
    cultoRepo: {
      findById: vi.fn().mockResolvedValue(makeCulto()),
      listarPorIgreja: vi.fn(),
      listarPaginado: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      inscrever: vi.fn(),
      cancelarInscricao: vi.fn(),
      findInscricao: vi.fn(),
      contarInscritosPorInstrumento: vi.fn(),
      marcarAusente: vi.fn(),
    } as unknown as jest.Mocked<CultoRepository>,
    musicaRepo: {
      findById: vi.fn(),
      findByTitulo: vi.fn(),
      listarPorIgreja: vi.fn(),
      listarPaginado: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      arquivar: vi.fn(),
      restaurar: vi.fn(),
      findVinculo: vi.fn(),
      vincularCantor: vi.fn(),
      atualizarVinculo: vi.fn(),
      removerVinculo: vi.fn(),
      findFaixa: vi.fn(),
      adicionarFaixa: vi.fn(),
      atualizarFaixa: vi.fn(),
      removerFaixa: vi.fn(),
    } as unknown as jest.Mocked<MusicaRepository>,
    membroRepo: {
      findById: vi.fn().mockResolvedValue(makeMembro()),
      findByEmail: vi.fn(),
      findBySupabaseId: vi.fn(),
      listarPorIgreja: vi.fn(),
      listarPaginado: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      atualizarSupabaseId: vi.fn(),
      inativar: vi.fn(),
    } as unknown as jest.Mocked<MembroRepository>,
  }
}

// ── testes ────────────────────────────────────────────────────────────────────

describe("RepertorioService", () => {
  let repos: ReturnType<typeof makeRepos>
  let service: RepertorioService

  beforeEach(() => {
    repos = makeRepos()
    service = new RepertorioService(
      repos.repertorioRepo,
      repos.cultoRepo,
      repos.musicaRepo,
      repos.membroRepo
    )
  })

  describe("buscarPorCulto", () => {
    it("retorna null quando repertorio nao existe", async () => {
      repos.cultoRepo.findById.mockResolvedValue(makeCulto())
      repos.repertorioRepo.findByCulto.mockResolvedValue(null)

      const result = await service.buscarPorCulto("culto-1", "igreja-1")

      expect(result).toBeNull()
    })

    it("retorna o repertorio quando existe", async () => {
      const rep = makeRepertorio()
      repos.cultoRepo.findById.mockResolvedValue(makeCulto())
      repos.repertorioRepo.findByCulto.mockResolvedValue(rep)

      const result = await service.buscarPorCulto("culto-1", "igreja-1")

      expect(result).toEqual(rep)
    })

    it("lanca NaoEncontradoError quando culto nao existe", async () => {
      repos.cultoRepo.findById.mockResolvedValue(null)

      await expect(service.buscarPorCulto("inexistente", "igreja-1"))
        .rejects.toThrow(NaoEncontradoError)
    })
  })

  describe("criar", () => {
    it("cria repertorio com sucesso quando nao existe", async () => {
      repos.cultoRepo.findById.mockResolvedValue(makeCulto())
      repos.repertorioRepo.findByCulto.mockResolvedValue(null)
      repos.membroRepo.findById.mockResolvedValue(makeMembro({ id: "cantor-1", perfil: "CANTOR" as const }))
      const rep = makeRepertorio()
      repos.repertorioRepo.criar.mockResolvedValue(rep)

      const result = await service.criar("culto-1", "igreja-1", "cantor-1", "cantor-1")

      expect(result).toEqual(rep)
      expect(repos.repertorioRepo.criar).toHaveBeenCalledWith("culto-1", "cantor-1")
    })

    it("lanca RepertorioJaExisteError quando ja existe", async () => {
      repos.cultoRepo.findById.mockResolvedValue(makeCulto())
      repos.repertorioRepo.findByCulto.mockResolvedValue(makeRepertorio())
      repos.membroRepo.findById.mockResolvedValue(makeMembro({ id: "cantor-1", perfil: "CANTOR" as const }))

      await expect(service.criar("culto-1", "igreja-1", "cantor-1", "cantor-1"))
        .rejects.toThrow(RepertorioJaExisteError)
    })
  })

  describe("adicionarItem", () => {
    it("adiciona item com sucesso quando musica tem tom do cantor", async () => {
      repos.cultoRepo.findById.mockResolvedValue(makeCulto())
      repos.repertorioRepo.findByCulto.mockResolvedValue(makeRepertorio())
      repos.membroRepo.findById.mockResolvedValue(makeMembro())
      repos.repertorioRepo.findItemPorMusica.mockResolvedValue(null)
      repos.musicaRepo.findById.mockResolvedValue(makeMusica())
      repos.repertorioRepo.adicionarItem.mockResolvedValue({ id: "item-1" })

      await service.adicionarItem("culto-1", "igreja-1", "admin-1", { musicaId: "musica-1" })

      expect(repos.repertorioRepo.adicionarItem).toHaveBeenCalledWith(
        "rep-1", "musica-1", "C", { musicaId: "musica-1" }
      )
    })

    it("lanca MusicaJaNoRepertorioError quando musica ja esta no repertorio", async () => {
      repos.cultoRepo.findById.mockResolvedValue(makeCulto())
      repos.repertorioRepo.findByCulto.mockResolvedValue(makeRepertorio())
      repos.membroRepo.findById.mockResolvedValue(makeMembro())
      repos.repertorioRepo.findItemPorMusica.mockResolvedValue({ id: "item-existente" })

      await expect(
        service.adicionarItem("culto-1", "igreja-1", "admin-1", { musicaId: "musica-1" })
      ).rejects.toThrow(MusicaJaNoRepertorioError)
    })

    it("lanca MusicaSemTomError quando cantor nao esta vinculado a musica", async () => {
      repos.cultoRepo.findById.mockResolvedValue(makeCulto())
      repos.repertorioRepo.findByCulto.mockResolvedValue(makeRepertorio())
      repos.membroRepo.findById.mockResolvedValue(makeMembro())
      repos.repertorioRepo.findItemPorMusica.mockResolvedValue(null)
      // Musica sem vinculo com o cantor do repertorio
      repos.musicaRepo.findById.mockResolvedValue(makeMusica({ cantores: [] }))

      await expect(
        service.adicionarItem("culto-1", "igreja-1", "admin-1", { musicaId: "musica-1" })
      ).rejects.toThrow(MusicaSemTomError)
    })

    it("lanca SemPermissaoRepertorioError quando nao e admin nem cantor do repertorio", async () => {
      repos.cultoRepo.findById.mockResolvedValue(makeCulto())
      repos.repertorioRepo.findByCulto.mockResolvedValue(makeRepertorio({ cantorId: "cantor-1" }))
      repos.membroRepo.findById.mockResolvedValue(makeMembro({ id: "outro-membro", perfil: "MUSICO" as const }))

      await expect(
        service.adicionarItem("culto-1", "igreja-1", "outro-membro", { musicaId: "musica-1" })
      ).rejects.toThrow(SemPermissaoRepertorioError)
    })
  })

  describe("listarHistoricoDoMembro", () => {
    it("delega para o repository com os parametros corretos", async () => {
      repos.repertorioRepo.listarHistorico.mockResolvedValue([])

      await service.listarHistoricoDoMembro("igreja-1", "membro-1")

      expect(repos.repertorioRepo.listarHistorico).toHaveBeenCalledWith("igreja-1", "membro-1")
    })

    it("retorna lista vazia quando nao ha historico", async () => {
      repos.repertorioRepo.listarHistorico.mockResolvedValue([])

      const result = await service.listarHistoricoDoMembro("igreja-1", "membro-1")

      expect(result).toEqual([])
    })
  })
})
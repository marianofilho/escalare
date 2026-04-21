// tests/unit/services/solicitacao.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SolicitacaoService, SolicitacaoJaExisteError } from "@/services/solicitacao.service"
import { NaoEncontradoError, AcessoNegadoError } from "@/types/errors"
import { CantorJaVinculadoError, PerfilInvalidoParaCantorError } from "@/types/musica-errors"
import type { SolicitacaoRepository } from "@/repositories/solicitacao.repository"
import type { MusicaRepository } from "@/repositories/musica.repository"
import type { MembroRepository } from "@/repositories/membro.repository"

// ── helpers ──────────────────────────────────────────────────────────────────

function makeCantor(overrides = {}) {
  return {
    id: "cantor-1", igrejaId: "igreja-1", perfil: "CANTOR" as const,
    nome: "Cantor", email: "cantor@teste.com", supabaseId: null,
    telefone: null, fotoPerfil: null, instrumentoPrincipal: null,
    instrumentoSecundario: null, fazBackingVocal: false,
    status: "ATIVO" as const, dataIngresso: null,
    criadoEm: new Date(), atualizadoEm: new Date(),
    ...overrides,
  }
}

function makeAdmin(overrides = {}) {
  return makeCantor({ id: "admin-1", perfil: "ADMINISTRADOR" as const, email: "admin@teste.com", ...overrides })
}

function makeMusica(overrides = {}) {
  return {
    id: "musica-1", igrejaId: "igreja-1", titulo: "Musica Teste",
    artista: null, bpm: null, linkVideo: null, linkCifra: null,
    linkPartitura: null, status: "ATIVA" as const,
    criadoEm: new Date(), atualizadoEm: new Date(), cantores: [],
    ...overrides,
  }
}

function makeSolicitacao(overrides = {}) {
  return {
    id: "sol-1", musicaId: "musica-1", musicaTitulo: "Musica Teste",
    musicaArtista: null, cantorId: "cantor-1", cantorNome: "Cantor",
    cantorFoto: null, tomSugerido: null, status: "PENDENTE",
    criadoEm: new Date().toISOString(),
    ...overrides,
  }
}

function makeRepos() {
  return {
    solicitacaoRepo: {
      findById: vi.fn(),
      findPorMusicaCantor: vi.fn(),
      listarPendentes: vi.fn(),
      listarPorCantor: vi.fn(),
      contarPendentes: vi.fn(),
      criar: vi.fn(),
      aprovar: vi.fn(),
      recusar: vi.fn(),
    } as unknown as jest.Mocked<SolicitacaoRepository>,
    musicaRepo: {
      findById: vi.fn(),
      findByTitulo: vi.fn(),
      findVinculo: vi.fn(),
      vincularCantor: vi.fn(),
      listarPorIgreja: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      arquivar: vi.fn(),
      restaurar: vi.fn(),
      atualizarVinculo: vi.fn(),
      removerVinculo: vi.fn(),
      findFaixa: vi.fn(),
      adicionarFaixa: vi.fn(),
      atualizarFaixa: vi.fn(),
      removerFaixa: vi.fn(),
    } as unknown as jest.Mocked<MusicaRepository>,
    membroRepo: {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findBySupabaseId: vi.fn(),
      listarPorIgreja: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      atualizarSupabaseId: vi.fn(),
      inativar: vi.fn(),
    } as unknown as jest.Mocked<MembroRepository>,
  }
}

// ── testes ────────────────────────────────────────────────────────────────────

describe("SolicitacaoService", () => {
  let repos: ReturnType<typeof makeRepos>
  let service: SolicitacaoService

  beforeEach(() => {
    repos = makeRepos()
    service = new SolicitacaoService(repos.solicitacaoRepo, repos.musicaRepo, repos.membroRepo)
  })

  describe("solicitar", () => {
    const dto = { musicaId: "musica-1" }

    it("cria solicitação com sucesso", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeCantor())
      repos.musicaRepo.findById.mockResolvedValue(makeMusica())
      repos.musicaRepo.findVinculo.mockResolvedValue(null)
      repos.solicitacaoRepo.findPorMusicaCantor.mockResolvedValue(null)
      const sol = makeSolicitacao()
      repos.solicitacaoRepo.criar.mockResolvedValue(sol)

      const result = await service.solicitar(dto, "cantor-1", "igreja-1")

      expect(result).toEqual(sol)
      expect(repos.solicitacaoRepo.criar).toHaveBeenCalledWith("igreja-1", "musica-1", "cantor-1", undefined)
    })

    it("lança PerfilInvalidoParaCantorError quando membro não é cantor", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeCantor({ perfil: "MUSICO" }))

      await expect(service.solicitar(dto, "musico-1", "igreja-1"))
        .rejects.toThrow(PerfilInvalidoParaCantorError)
    })

    it("lança CantorJaVinculadoError quando já está vinculado", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeCantor())
      repos.musicaRepo.findById.mockResolvedValue(makeMusica())
      repos.musicaRepo.findVinculo.mockResolvedValue({ id: "vinculo-1" })

      await expect(service.solicitar(dto, "cantor-1", "igreja-1"))
        .rejects.toThrow(CantorJaVinculadoError)
    })

    it("lança SolicitacaoJaExisteError quando já existe solicitação", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeCantor())
      repos.musicaRepo.findById.mockResolvedValue(makeMusica())
      repos.musicaRepo.findVinculo.mockResolvedValue(null)
      repos.solicitacaoRepo.findPorMusicaCantor.mockResolvedValue({ id: "sol-existente" })

      await expect(service.solicitar(dto, "cantor-1", "igreja-1"))
        .rejects.toThrow(SolicitacaoJaExisteError)
    })

    it("cria solicitação com tom sugerido opcional", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeCantor())
      repos.musicaRepo.findById.mockResolvedValue(makeMusica())
      repos.musicaRepo.findVinculo.mockResolvedValue(null)
      repos.solicitacaoRepo.findPorMusicaCantor.mockResolvedValue(null)
      repos.solicitacaoRepo.criar.mockResolvedValue(makeSolicitacao({ tomSugerido: "C" }))

      await service.solicitar({ musicaId: "musica-1", tomSugerido: "C" }, "cantor-1", "igreja-1")

      expect(repos.solicitacaoRepo.criar).toHaveBeenCalledWith("igreja-1", "musica-1", "cantor-1", "C")
    })
  })

  describe("aprovar", () => {
    it("aprova e cria vínculo com sucesso", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeAdmin())
      repos.solicitacaoRepo.findById.mockResolvedValue({
        id: "sol-1", musicaId: "musica-1", cantorId: "cantor-1",
        musica: { titulo: "Musica" }, cantor: { nome: "Cantor", fotoPerfil: null },
        tomSugerido: null, status: "PENDENTE", criadoEm: new Date(),
      })
      repos.musicaRepo.findVinculo.mockResolvedValue(null)
      repos.musicaRepo.vincularCantor.mockResolvedValue({ id: "vinculo-novo" })
      repos.solicitacaoRepo.aprovar.mockResolvedValue(undefined)

      await service.aprovar("sol-1", { tom: "G" }, "admin-1", "igreja-1")

      expect(repos.musicaRepo.vincularCantor).toHaveBeenCalledWith("musica-1", { cantorId: "cantor-1", tom: "G" })
      expect(repos.solicitacaoRepo.aprovar).toHaveBeenCalledWith("sol-1")
    })

    it("lança AcessoNegadoError quando não é admin", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeCantor())

      await expect(service.aprovar("sol-1", { tom: "G" }, "cantor-1", "igreja-1"))
        .rejects.toThrow(AcessoNegadoError)
    })

    it("lança NaoEncontradoError quando solicitação não existe", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeAdmin())
      repos.solicitacaoRepo.findById.mockResolvedValue(null)

      await expect(service.aprovar("inexistente", { tom: "G" }, "admin-1", "igreja-1"))
        .rejects.toThrow(NaoEncontradoError)
    })
  })

  describe("recusar", () => {
    it("recusa com sucesso quando admin", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeAdmin())
      repos.solicitacaoRepo.findById.mockResolvedValue({
        id: "sol-1", musicaId: "musica-1", cantorId: "cantor-1",
        musica: { titulo: "Musica" }, cantor: { nome: "Cantor", fotoPerfil: null },
        tomSugerido: null, status: "PENDENTE", criadoEm: new Date(),
      })
      repos.solicitacaoRepo.recusar.mockResolvedValue(undefined)

      await service.recusar("sol-1", "admin-1", "igreja-1")

      expect(repos.solicitacaoRepo.recusar).toHaveBeenCalledWith("sol-1")
    })

    it("lança AcessoNegadoError quando não é admin", async () => {
      repos.membroRepo.findById.mockResolvedValue(makeCantor())

      await expect(service.recusar("sol-1", "cantor-1", "igreja-1"))
        .rejects.toThrow(AcessoNegadoError)
    })
  })
})
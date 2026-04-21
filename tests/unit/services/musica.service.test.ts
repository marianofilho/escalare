// tests/unit/services/musica.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MusicaService } from "@/services/musica.service"
import { NaoEncontradoError, AcessoNegadoError } from "@/types/errors"
import {
  MusicaJaExisteError,
  CantorJaVinculadoError,
  PerfilInvalidoParaCantorError,
} from "@/types/musica-errors"
import type { MusicaRepository } from "@/repositories/musica.repository"
import type { MembroRepository } from "@/repositories/membro.repository"

// ── helpers ──────────────────────────────────────────────────────────────────

function makeMusica(overrides = {}) {
  return {
    id: "musica-1",
    igrejaId: "igreja-1",
    titulo: "Grande e Forte",
    artista: "Ministério Zoe",
    bpm: 120,
    linkVideo: null,
    linkCifra: null,
    linkPartitura: null,
    status: "ATIVA" as const,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    cantores: [],
    ...overrides,
  }
}

function makeMembro(overrides = {}) {
  return {
    id: "admin-1",
    igrejaId: "igreja-1",
    perfil: "ADMINISTRADOR" as const,
    nome: "Admin",
    email: "admin@teste.com",
    supabaseId: null,
    telefone: null,
    fotoPerfil: null,
    instrumentoPrincipal: null,
    instrumentoSecundario: null,
    fazBackingVocal: false,
    status: "ATIVO" as const,
    dataIngresso: null,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    ...overrides,
  }
}

function makeRepos() {
  const musicaRepo = {
    findById: vi.fn(),
    findByTitulo: vi.fn(),
    listarPorIgreja: vi.fn(),
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
  } as unknown as jest.Mocked<MusicaRepository>

  const membroRepo = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findBySupabaseId: vi.fn(),
    listarPorIgreja: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    atualizarSupabaseId: vi.fn(),
    inativar: vi.fn(),
  } as unknown as jest.Mocked<MembroRepository>

  return { musicaRepo, membroRepo }
}

// ── testes ────────────────────────────────────────────────────────────────────

describe("MusicaService", () => {
  let musicaRepo: ReturnType<typeof makeRepos>["musicaRepo"]
  let membroRepo: ReturnType<typeof makeRepos>["membroRepo"]
  let service: MusicaService

  beforeEach(() => {
    const repos = makeRepos()
    musicaRepo = repos.musicaRepo
    membroRepo = repos.membroRepo
    service = new MusicaService(musicaRepo, membroRepo)
  })

  describe("criar", () => {
    const dto = { titulo: "Grande e Forte", artista: "Zoe", bpm: 120 }

    it("cria musica com sucesso quando admin e titulo unico", async () => {
      membroRepo.findById.mockResolvedValue(makeMembro())
      musicaRepo.findByTitulo.mockResolvedValue(null)
      const musica = makeMusica()
      musicaRepo.criar.mockResolvedValue(musica)

      const result = await service.criar(dto, "igreja-1", "admin-1")

      expect(result).toEqual(musica)
      expect(musicaRepo.criar).toHaveBeenCalledWith({ ...dto, igrejaId: "igreja-1" })
    })

    it("lança AcessoNegadoError quando não é admin", async () => {
      membroRepo.findById.mockResolvedValue(makeMembro({ perfil: "MUSICO" }))

      await expect(service.criar(dto, "igreja-1", "musico-1"))
        .rejects.toThrow(AcessoNegadoError)

      expect(musicaRepo.criar).not.toHaveBeenCalled()
    })

    it("lança MusicaJaExisteError quando titulo duplicado", async () => {
      membroRepo.findById.mockResolvedValue(makeMembro())
      musicaRepo.findByTitulo.mockResolvedValue(makeMusica())

      await expect(service.criar(dto, "igreja-1", "admin-1"))
        .rejects.toThrow(MusicaJaExisteError)
    })
  })

  describe("arquivar", () => {
    it("arquiva musica quando admin e musica existe", async () => {
      membroRepo.findById.mockResolvedValue(makeMembro())
      musicaRepo.findById.mockResolvedValue(makeMusica())
      musicaRepo.arquivar.mockResolvedValue(makeMusica({ status: "ARQUIVADA" }))

      await service.arquivar("musica-1", "igreja-1", "admin-1")

      expect(musicaRepo.arquivar).toHaveBeenCalledWith("musica-1")
    })

    it("lança NaoEncontradoError quando musica não existe", async () => {
      membroRepo.findById.mockResolvedValue(makeMembro())
      musicaRepo.findById.mockResolvedValue(null)

      await expect(service.arquivar("inexistente", "igreja-1", "admin-1"))
        .rejects.toThrow(NaoEncontradoError)
    })
  })

  describe("restaurar", () => {
    it("restaura musica arquivada quando admin", async () => {
      membroRepo.findById.mockResolvedValue(makeMembro())
      musicaRepo.findById.mockResolvedValue(makeMusica({ status: "ARQUIVADA" }))
      musicaRepo.restaurar.mockResolvedValue(makeMusica({ status: "ATIVA" }))

      await service.restaurar("musica-1", "igreja-1", "admin-1")

      expect(musicaRepo.restaurar).toHaveBeenCalledWith("musica-1")
    })
  })

  describe("vincularCantor", () => {
    it("vincula cantor com sucesso", async () => {
      membroRepo.findById
        .mockResolvedValueOnce(makeMembro()) // admin
        .mockResolvedValueOnce(makeMembro({ id: "cantor-1", perfil: "CANTOR" })) // cantor
      musicaRepo.findById.mockResolvedValue(makeMusica())
      musicaRepo.findVinculo.mockResolvedValue(null)
      musicaRepo.vincularCantor.mockResolvedValue({ id: "vinculo-1", musicaId: "musica-1", cantorId: "cantor-1", tom: "C", faixas: [] })

      await service.vincularCantor("musica-1", "igreja-1", "admin-1", { cantorId: "cantor-1", tom: "C" })

      expect(musicaRepo.vincularCantor).toHaveBeenCalledWith("musica-1", { cantorId: "cantor-1", tom: "C" })
    })

    it("lança PerfilInvalidoParaCantorError quando membro não é cantor", async () => {
      membroRepo.findById
        .mockResolvedValueOnce(makeMembro()) // admin
        .mockResolvedValueOnce(makeMembro({ id: "musico-1", perfil: "MUSICO" })) // não é cantor
      musicaRepo.findById.mockResolvedValue(makeMusica())

      await expect(
        service.vincularCantor("musica-1", "igreja-1", "admin-1", { cantorId: "musico-1", tom: "C" })
      ).rejects.toThrow(PerfilInvalidoParaCantorError)
    })

    it("lança CantorJaVinculadoError quando já existe vínculo", async () => {
      membroRepo.findById
        .mockResolvedValueOnce(makeMembro())
        .mockResolvedValueOnce(makeMembro({ id: "cantor-1", perfil: "CANTOR" }))
      musicaRepo.findById.mockResolvedValue(makeMusica())
      musicaRepo.findVinculo.mockResolvedValue({ id: "vinculo-existente" })

      await expect(
        service.vincularCantor("musica-1", "igreja-1", "admin-1", { cantorId: "cantor-1", tom: "C" })
      ).rejects.toThrow(CantorJaVinculadoError)
    })
  })
})
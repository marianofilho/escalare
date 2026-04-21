// tests/unit/services/membro.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MembroService } from "@/services/membro.service"
import { NaoEncontradoError, MembroJaExisteError } from "@/types/errors"
import type { MembroRepository } from "@/repositories/membro.repository"

// ── helpers ──────────────────────────────────────────────────────────────────

function makeMembro(overrides = {}) {
  return {
    id: "membro-1",
    igrejaId: "igreja-1",
    supabaseId: null,
    nome: "Ana Silva",
    email: "ana@teste.com",
    telefone: null,
    fotoPerfil: null,
    perfil: "MUSICO" as const,
    instrumentoPrincipal: "Violao",
    instrumentoSecundario: null,
    fazBackingVocal: false,
    status: "ATIVO" as const,
    dataIngresso: null,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    ...overrides,
  }
}

function makeMembroComHistorico(overrides = {}) {
  return {
    ...makeMembro(),
    inscricoes: [
      {
        instrumento: "Violao",
        fazBacking: false,
        ausente: false,
        culto: {
          id: "culto-1",
          tipo: "CULTO_DOMINGO_MANHA",
          subtipo: null,
          dataHoraInicio: new Date("2025-06-01T09:00:00Z"),
          status: "REALIZADO",
        },
      },
      {
        instrumento: "Violao",
        fazBacking: true,
        ausente: false,
        culto: {
          id: "culto-2",
          tipo: "ENSAIO",
          subtipo: null,
          dataHoraInicio: new Date("2025-05-28T19:00:00Z"),
          status: "REALIZADO",
        },
      },
    ],
    tomsCantor: [],
    ...overrides,
  }
}

function makeRepo(): jest.Mocked<MembroRepository> {
  return {
    findById: vi.fn(),
    findByIdComHistorico: vi.fn(),
    findByEmail: vi.fn(),
    findBySupabaseId: vi.fn(),
    listarPorIgreja: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    atualizarSupabaseId: vi.fn(),
    inativar: vi.fn(),
  } as unknown as jest.Mocked<MembroRepository>
}

// ── testes ────────────────────────────────────────────────────────────────────

describe("MembroService", () => {
  let repo: ReturnType<typeof makeRepo>
  let service: MembroService

  beforeEach(() => {
    repo = makeRepo()
    service = new MembroService(repo)
  })

  describe("buscarPorId", () => {
    it("retorna o membro quando encontrado", async () => {
      const membro = makeMembro()
      repo.findById.mockResolvedValue(membro)

      const result = await service.buscarPorId("membro-1", "igreja-1")

      expect(result).toEqual(membro)
      expect(repo.findById).toHaveBeenCalledWith("membro-1", "igreja-1")
    })

    it("lanca NaoEncontradoError quando nao encontrado", async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.buscarPorId("inexistente", "igreja-1"))
        .rejects.toThrow(NaoEncontradoError)
    })
  })

  describe("buscarPerfilCompleto", () => {
    it("retorna perfil com historico de cultos mapeado", async () => {
      repo.findByIdComHistorico.mockResolvedValue(makeMembroComHistorico())

      const result = await service.buscarPerfilCompleto("membro-1", "igreja-1")

      expect(result.id).toBe("membro-1")
      expect(result.totalCultos).toBe(2)
      expect(result.cultosRecentes).toHaveLength(2)
      expect(result.cultosRecentes[0].cultoId).toBe("culto-1")
      expect(result.cultosRecentes[0].instrumento).toBe("Violao")
    })

    it("mapeia tipo de culto para label legivel", async () => {
      repo.findByIdComHistorico.mockResolvedValue(makeMembroComHistorico())

      const result = await service.buscarPerfilCompleto("membro-1", "igreja-1")

      expect(result.cultosRecentes[0].tipo).toBe("Culto Domingo Manha")
      expect(result.cultosRecentes[1].tipo).toBe("Ensaio")
    })

    it("retorna musicasVinculadas vazias para nao-cantores", async () => {
      repo.findByIdComHistorico.mockResolvedValue(makeMembroComHistorico())

      const result = await service.buscarPerfilCompleto("membro-1", "igreja-1")

      expect(result.musicasVinculadas).toHaveLength(0)
    })

    it("retorna musicasVinculadas para cantores", async () => {
      const membroCantor = makeMembroComHistorico({
        perfil: "CANTOR",
        tomsCantor: [
          {
            tom: "C",
            musica: {
              id: "musica-1",
              titulo: "Grande e Forte",
              artista: "Zoe",
              status: "ATIVA",
            },
          },
        ],
      })
      repo.findByIdComHistorico.mockResolvedValue(membroCantor)

      const result = await service.buscarPerfilCompleto("membro-1", "igreja-1")

      expect(result.musicasVinculadas).toHaveLength(1)
      expect(result.musicasVinculadas[0].titulo).toBe("Grande e Forte")
      expect(result.musicasVinculadas[0].tom).toBe("C")
    })

    it("lanca NaoEncontradoError quando membro nao existe", async () => {
      repo.findByIdComHistorico.mockResolvedValue(null)

      await expect(service.buscarPerfilCompleto("inexistente", "igreja-1"))
        .rejects.toThrow(NaoEncontradoError)
    })

    it("retorna dataIngresso como null quando nao informada", async () => {
      repo.findByIdComHistorico.mockResolvedValue(makeMembroComHistorico())

      const result = await service.buscarPerfilCompleto("membro-1", "igreja-1")

      expect(result.dataIngresso).toBeNull()
    })

    it("mapeia dataIngresso para ISO string quando informada", async () => {
      const dataIngresso = new Date("2023-01-15")
      repo.findByIdComHistorico.mockResolvedValue(
        makeMembroComHistorico({ dataIngresso })
      )

      const result = await service.buscarPerfilCompleto("membro-1", "igreja-1")

      expect(result.dataIngresso).toBe(dataIngresso.toISOString())
    })

    it("marca ausencia corretamente no historico", async () => {
      repo.findByIdComHistorico.mockResolvedValue(
        makeMembroComHistorico({
          inscricoes: [
            {
              instrumento: "Violao",
              fazBacking: false,
              ausente: true,
              culto: {
                id: "culto-1",
                tipo: "CULTO_DOMINGO_MANHA",
                subtipo: null,
                dataHoraInicio: new Date(),
                status: "REALIZADO",
              },
            },
          ],
        })
      )

      const result = await service.buscarPerfilCompleto("membro-1", "igreja-1")

      expect(result.cultosRecentes[0].ausente).toBe(true)
    })
  })

  describe("criar", () => {
    const dto = {
      nome: "Joao Costa",
      email: "joao@teste.com",
      perfil: "MUSICO" as const,
      fazBackingVocal: false,
    }

    it("cria o membro com sucesso quando email nao existe", async () => {
      repo.findByEmail.mockResolvedValue(null)
      const membroCriado = makeMembro({ ...dto, id: "novo-id" })
      repo.criar.mockResolvedValue(membroCriado)

      const result = await service.criar(dto, "igreja-1")

      expect(result).toEqual(membroCriado)
      expect(repo.criar).toHaveBeenCalledWith({ ...dto, igrejaId: "igreja-1" })
    })

    it("lanca MembroJaExisteError quando email ja cadastrado", async () => {
      repo.findByEmail.mockResolvedValue(makeMembro())

      await expect(service.criar(dto, "igreja-1"))
        .rejects.toThrow(MembroJaExisteError)

      expect(repo.criar).not.toHaveBeenCalled()
    })
  })

  describe("atualizar", () => {
    it("atualiza com sucesso quando membro existe", async () => {
      const membro = makeMembro()
      repo.findById.mockResolvedValue(membro)
      repo.findByEmail.mockResolvedValue(null)
      const membroAtualizado = makeMembro({ nome: "Ana Costa" })
      repo.atualizar.mockResolvedValue(membroAtualizado)

      const result = await service.atualizar("membro-1", "igreja-1", { nome: "Ana Costa" })

      expect(result).toEqual(membroAtualizado)
    })

    it("lanca NaoEncontradoError quando membro nao existe", async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.atualizar("inexistente", "igreja-1", { nome: "X" }))
        .rejects.toThrow(NaoEncontradoError)
    })

    it("lanca MembroJaExisteError ao mudar para email ja usado por outro", async () => {
      const membro = makeMembro()
      const outro = makeMembro({ id: "outro", email: "outro@teste.com" })
      repo.findById.mockResolvedValue(membro)
      repo.findByEmail.mockResolvedValue(outro)

      await expect(
        service.atualizar("membro-1", "igreja-1", { email: "outro@teste.com" })
      ).rejects.toThrow(MembroJaExisteError)
    })
  })

  describe("inativar", () => {
    it("inativa o membro quando existe", async () => {
      repo.findById.mockResolvedValue(makeMembro())
      repo.inativar.mockResolvedValue(makeMembro({ status: "INATIVO" }))

      await service.inativar("membro-1", "igreja-1")

      expect(repo.inativar).toHaveBeenCalledWith("membro-1", "igreja-1")
    })

    it("lanca NaoEncontradoError quando membro nao existe", async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.inativar("inexistente", "igreja-1"))
        .rejects.toThrow(NaoEncontradoError)
    })
  })
})
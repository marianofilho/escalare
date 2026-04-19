// src/repositories/musica.repository.ts
import { prisma } from "@/lib/prisma"
import type { Musica } from "@prisma/client"
import type {
  CriarMusicaDto,
  AtualizarMusicaDto,
  VincularCantorDto,
  AtualizarCantorDto,
  CriarFaixaDto,
  AtualizarFaixaDto,
} from "@/dtos/musica/criar-musica.dto"

const cantoresInclude = {
  cantores: {
    include: {
      cantor: { select: { id: true, nome: true, fotoPerfil: true } },
      faixas: { orderBy: { instrumento: "asc" as const } },
    },
    orderBy: { cantor: { nome: "asc" as const } },
  },
} as const

export class MusicaRepository {
  // --- Musica ---

  async findById(id: string, igrejaId: string) {
    return prisma.musica.findFirst({
      where: { id, igrejaId },
      include: cantoresInclude,
    })
  }

  async findByTitulo(titulo: string, igrejaId: string): Promise<Musica | null> {
    return prisma.musica.findFirst({
      where: { titulo: { equals: titulo, mode: "insensitive" }, igrejaId },
    })
  }

  async listarPorIgreja(igrejaId: string, filtros?: { status?: string; busca?: string }) {
    return prisma.musica.findMany({
      where: {
        igrejaId,
        ...(filtros?.status ? { status: filtros.status as "ATIVA" | "ARQUIVADA" } : {}),
        ...(filtros?.busca
          ? {
              OR: [
                { titulo: { contains: filtros.busca, mode: "insensitive" } },
                { artista: { contains: filtros.busca, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { titulo: "asc" },
      include: cantoresInclude,
    })
  }

  async criar(data: CriarMusicaDto & { igrejaId: string }) {
    return prisma.musica.create({
      data: {
        igrejaId: data.igrejaId,
        titulo: data.titulo,
        artista: data.artista || undefined,
        bpm: data.bpm,
        linkVideo: data.linkVideo || undefined,
        linkCifra: data.linkCifra || undefined,
        linkPartitura: data.linkPartitura || undefined,
      },
      include: cantoresInclude,
    })
  }

  async atualizar(id: string, data: AtualizarMusicaDto) {
    return prisma.musica.update({
      where: { id },
      data: {
        titulo: data.titulo,
        artista: data.artista || undefined,
        bpm: data.bpm,
        linkVideo: data.linkVideo || undefined,
        linkCifra: data.linkCifra || undefined,
        linkPartitura: data.linkPartitura || undefined,
        status: data.status,
      },
      include: cantoresInclude,
    })
  }

  async arquivar(id: string) {
    return prisma.musica.update({
      where: { id },
      data: { status: "ARQUIVADA" },
      include: cantoresInclude,
    })
  }

  // --- MusicaCantor ---

  async findVinculo(musicaId: string, cantorId: string) {
    return prisma.musicaCantor.findUnique({
      where: { musicaId_cantorId: { musicaId, cantorId } },
      include: { faixas: true },
    })
  }

  async vincularCantor(musicaId: string, dto: VincularCantorDto) {
    return prisma.musicaCantor.create({
      data: { musicaId, cantorId: dto.cantorId, tom: dto.tom },
      include: {
        cantor: { select: { id: true, nome: true, fotoPerfil: true } },
        faixas: true,
      },
    })
  }

  async atualizarVinculo(musicaId: string, cantorId: string, dto: AtualizarCantorDto) {
    return prisma.musicaCantor.update({
      where: { musicaId_cantorId: { musicaId, cantorId } },
      data: { tom: dto.tom },
      include: {
        cantor: { select: { id: true, nome: true, fotoPerfil: true } },
        faixas: true,
      },
    })
  }

  async removerVinculo(musicaId: string, cantorId: string) {
    return prisma.musicaCantor.delete({
      where: { musicaId_cantorId: { musicaId, cantorId } },
    })
  }

  // --- MusicaFaixa ---

  async findFaixa(faixaId: string) {
    return prisma.musicaFaixa.findUnique({
      where: { id: faixaId },
      include: { musicaCantor: true },
    })
  }

  async adicionarFaixa(musicaCantorId: string, dto: CriarFaixaDto) {
    return prisma.musicaFaixa.create({
      data: { musicaCantorId, instrumento: dto.instrumento, linkAudio: dto.linkAudio },
    })
  }

  async atualizarFaixa(faixaId: string, dto: AtualizarFaixaDto) {
    return prisma.musicaFaixa.update({
      where: { id: faixaId },
      data: { instrumento: dto.instrumento, linkAudio: dto.linkAudio },
    })
  }

  async removerFaixa(faixaId: string) {
    return prisma.musicaFaixa.delete({ where: { id: faixaId } })
  }
}
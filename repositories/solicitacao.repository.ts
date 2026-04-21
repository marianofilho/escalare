// src/repositories/solicitacao.repository.ts
import { prisma } from "@/lib/prisma"
import type { SolicitacaoResponseDto } from "@/dtos/solicitacao/solicitacao.dto"

const solicitacaoInclude = {
  musica: { select: { id: true, titulo: true, artista: true } },
  cantor: { select: { id: true, nome: true, fotoPerfil: true } },
} as const

function mapear(s: {
  id: string
  musicaId: string
  musica: { titulo: string; artista: string | null }
  cantorId: string
  cantor: { nome: string; fotoPerfil: string | null }
  tomSugerido: string | null
  status: string
  criadoEm: Date
}): SolicitacaoResponseDto {
  return {
    id: s.id,
    musicaId: s.musicaId,
    musicaTitulo: s.musica.titulo,
    musicaArtista: s.musica.artista,
    cantorId: s.cantorId,
    cantorNome: s.cantor.nome,
    cantorFoto: s.cantor.fotoPerfil,
    tomSugerido: s.tomSugerido,
    status: s.status,
    criadoEm: s.criadoEm.toISOString(),
  }
}

export class SolicitacaoRepository {
  async findById(id: string) {
    return prisma.solicitacaoVinculo.findUnique({
      where: { id },
      include: solicitacaoInclude,
    })
  }

  async findPorMusicaCantor(musicaId: string, cantorId: string) {
    return prisma.solicitacaoVinculo.findUnique({
      where: { musicaId_cantorId: { musicaId, cantorId } },
    })
  }

  async listarPendentes(igrejaId: string): Promise<SolicitacaoResponseDto[]> {
    const rows = await prisma.solicitacaoVinculo.findMany({
      where: { igrejaId, status: "PENDENTE" },
      orderBy: { criadoEm: "asc" },
      include: solicitacaoInclude,
    })
    return rows.map(mapear)
  }

  async listarPorCantor(cantorId: string, igrejaId: string): Promise<SolicitacaoResponseDto[]> {
    const rows = await prisma.solicitacaoVinculo.findMany({
      where: { cantorId, igrejaId },
      orderBy: { criadoEm: "desc" },
      include: solicitacaoInclude,
    })
    return rows.map(mapear)
  }

  async contarPendentes(igrejaId: string): Promise<number> {
    return prisma.solicitacaoVinculo.count({
      where: { igrejaId, status: "PENDENTE" },
    })
  }

  async criar(
    igrejaId: string,
    musicaId: string,
    cantorId: string,
    tomSugerido?: string
  ): Promise<SolicitacaoResponseDto> {
    const row = await prisma.solicitacaoVinculo.create({
      data: { igrejaId, musicaId, cantorId, tomSugerido: tomSugerido ?? null },
      include: solicitacaoInclude,
    })
    return mapear(row)
  }

  async aprovar(id: string): Promise<void> {
    await prisma.solicitacaoVinculo.update({
      where: { id },
      data: { status: "APROVADA" },
    })
  }

  async recusar(id: string): Promise<void> {
    await prisma.solicitacaoVinculo.update({
      where: { id },
      data: { status: "RECUSADA" },
    })
  }
}
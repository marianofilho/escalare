// src/dtos/repertorio/repertorio-response.dto.ts
import type {
  Repertorio, ItemRepertorio, Musica,
  MusicaCantor, MusicaFaixa, Membro, Culto,
} from "@prisma/client"

// Mantém o link original — a conversão para preview é feita no componente
function converterLinkDrive(link: string): string {
  return link
}

export interface FaixaEstudoDto {
  id: string
  instrumento: string
  linkAudio: string // já convertido para download
}

export interface MusicaCantorEstudoDto {
  cantorNome: string
  tom: string
  faixas: FaixaEstudoDto[]
}

export interface ItemRepertorioResponseDto {
  id: string
  musicaId: string
  musicaTitulo: string
  musicaArtista: string | null
  musicaLinkVideo: string | null
  musicaBpm: number | null
  ordem: number | null
  tomUsado: string
  observacoes: string | null
  // Faixas do cantor deste repertório (para a tela de estudo)
  cantorInfo: MusicaCantorEstudoDto | null
}

export interface RepertorioInterfaceResponseDto {
  id: string
  cultoId: string
  cantorId: string
  cantorNome: string
  itens: ItemRepertorioResponseDto[]
  totalItens: number
  criadoEm: string
  atualizadoEm: string
}

// Tipos internos do Prisma com relações
type FaixaRaw = MusicaFaixa
type MusicaCantorRaw = MusicaCantor & { faixas: FaixaRaw[] }
type MusicaComCantores = Musica & { cantores: MusicaCantorRaw[] }
type ItemRaw = ItemRepertorio & { musica: MusicaComCantores }
type RepertorioRaw = Repertorio & {
  cantor: Pick<Membro, "id" | "nome">
  itens: ItemRaw[]
}

export class RepertorioResponseDto {
  static from(repertorio: RepertorioRaw): RepertorioInterfaceResponseDto {
    return {
      id: repertorio.id,
      cultoId: repertorio.cultoId,
      cantorId: repertorio.cantorId,
      cantorNome: repertorio.cantor.nome,
      itens: repertorio.itens
        .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))
        .map((item) => {
          // Busca o vínculo do cantor do repertório com esta música
          const vincCantor = item.musica.cantores.find(
            (mc) => mc.cantorId === repertorio.cantorId
          ) ?? null

          return {
            id: item.id,
            musicaId: item.musicaId,
            musicaTitulo: item.musica.titulo,
            musicaArtista: item.musica.artista ?? null,
            musicaLinkVideo: item.musica.linkVideo ?? null,
            musicaBpm: item.musica.bpm ?? null,
            ordem: item.ordem ?? null,
            tomUsado: item.tomUsado,
            observacoes: item.observacoes ?? null,
            cantorInfo: vincCantor
              ? {
                  cantorNome: repertorio.cantor.nome,
                  tom: vincCantor.tom,
                  faixas: vincCantor.faixas.map((f) => ({
                    id: f.id,
                    instrumento: f.instrumento,
                    linkAudio: converterLinkDrive(f.linkAudio),
                  })),
                }
              : null,
          }
        }),
      totalItens: repertorio.itens.length,
      criadoEm: repertorio.criadoEm.toISOString(),
      atualizadoEm: repertorio.atualizadoEm.toISOString(),
    }
  }
}

// DTO simplificado para a lista de cultos na tela /repertorio
export interface CultoComRepertorioDto {
  cultoId: string
  cultoTipo: string
  cultoData: string
  cantorNome: string | null
  temRepertorio: boolean
  totalMusicas: number
  membroEscalado: boolean
  instrumento: string | null
}
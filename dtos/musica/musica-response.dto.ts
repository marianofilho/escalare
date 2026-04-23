// src/dtos/musica/musica-response.dto.ts
import type { Musica, MusicaCantor, MusicaFaixa, Membro } from "@prisma/client"

export interface MusicaFaixaResponseDto {
  id: string
  instrumento: string
  linkAudio: string
}

export interface MusicaCantorResponseDto {
  id: string
  cantorId: string
  cantorNome: string
  cantorFoto: string | null
  tom: string
  faixas: MusicaFaixaResponseDto[]
}

type MusicaFaixaRaw = MusicaFaixa
type MusicaCantorComRelacoes = MusicaCantor & {
  cantor: Pick<Membro, "id" | "nome" | "fotoPerfil">
  faixas: MusicaFaixaRaw[]
}
type MusicaComRelacoes = Musica & {
  cantores: MusicaCantorComRelacoes[]
}

export class MusicaResponseDto {
  id!: string
  titulo!: string
  artista!: string | null
  bpm!: number | null
  linkVideo!: string | null
  linkCifra!: string | null
  linkPartitura!: string | null
  status!: string
  cantores!: MusicaCantorResponseDto[]
  totalCantores!: number
  criadoEm!: string
  atualizadoEm!: string

  static from(musica: MusicaComRelacoes): MusicaResponseDto {
    return {
      id: musica.id,
      titulo: musica.titulo,
      artista: musica.artista ?? null,
      bpm: musica.bpm ?? null,
      linkVideo: musica.linkVideo ?? null,
      linkCifra: musica.linkCifra ?? null,
      linkPartitura: musica.linkPartitura ?? null,
      status: musica.status,
      cantores: musica.cantores.map((mc) => ({
        id: mc.id,
        cantorId: mc.cantorId,
        cantorNome: mc.cantor.nome,
        cantorFoto: mc.cantor.fotoPerfil ?? null,
        tom: mc.tom,
        faixas: mc.faixas.map((f) => ({
          id: f.id,
          instrumento: f.instrumento,
          linkAudio: f.linkAudio,
        })),
      })),
      totalCantores: musica.cantores.length,
      criadoEm: musica.criadoEm.toISOString(),
      atualizadoEm: musica.atualizadoEm.toISOString(),
    }
  }
}
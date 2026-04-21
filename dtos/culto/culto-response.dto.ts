// src/dtos/culto/culto-response.dto.ts
import type { Culto, LimiteInstrumento, InscricaoCulto, Membro } from "@prisma/client"

type CultoComRelacoes = Culto & {
  limites: LimiteInstrumento[]
  inscricoes: (InscricaoCulto & {
    membro: Pick<Membro, "id" | "nome" | "fotoPerfil" | "perfil">
  })[]
}

export interface LimiteInstrumentoResponseDto {
  instrumento: string
  limite: number
  inscritos: number
}

export interface InscricaoResponseDto {
  id: string
  membroId: string
  membroNome: string
  membroFoto: string | null
  membroPerfil: string
  instrumento: string
  fazBacking: boolean
  ausente: boolean
  comoInstrumentista: boolean
}

export class CultoResponseDto {
  id: string
  tipo: string
  subtipo: string | null
  dataHoraInicio: string
  dataHoraFim: string | null
  cantorId: string | null
  status: string
  inscricoesAbertas: boolean
  prazoCancelamentoHoras: number
  repetirSemanal: boolean
  observacoesInternas: string | null
  limites: LimiteInstrumentoResponseDto[]
  inscricoes: InscricaoResponseDto[]
  totalInscritos: number
  criadoEm: string

  static from(culto: CultoComRelacoes): CultoResponseDto {
    const contaPorInstrumento = culto.inscricoes.reduce<Record<string, number>>((acc, i) => {
      acc[i.instrumento] = (acc[i.instrumento] ?? 0) + 1
      return acc
    }, {})

    return {
      id: culto.id,
      tipo: culto.tipo,
      subtipo: culto.subtipo ?? null,
      dataHoraInicio: culto.dataHoraInicio.toISOString(),
      dataHoraFim: culto.dataHoraFim?.toISOString() ?? null,
      cantorId: culto.cantorId ?? null,
      status: culto.status,
      inscricoesAbertas: culto.inscricoesAbertas,
      prazoCancelamentoHoras: culto.prazoCancelamentoHoras,
      repetirSemanal: culto.repetirSemanal,
      observacoesInternas: culto.observacoesInternas ?? null,
      limites: culto.limites.map((l) => ({
        instrumento: l.instrumento,
        limite: l.limite,
        inscritos: contaPorInstrumento[l.instrumento] ?? 0,
      })),
      inscricoes: culto.inscricoes.map((i) => ({
        id: i.id,
        membroId: i.membroId,
        membroNome: i.membro.nome,
        membroFoto: i.membro.fotoPerfil ?? null,
        membroPerfil: i.membro.perfil,
        instrumento: i.instrumento,
        fazBacking: i.fazBacking,
        ausente: i.ausente,
        comoInstrumentista: i.comoInstrumentista,
      })),
      totalInscritos: culto.inscricoes.length,
      criadoEm: culto.criadoEm.toISOString(),
    }
  }
}
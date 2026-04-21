// src/dtos/solicitacao/solicitacao.dto.ts
import { z } from "zod"

// ── Entrada ──────────────────────────────────────────────────────────────────

export const CriarSolicitacaoSchema = z.object({
  musicaId: z.string().cuid("ID de musica invalido"),
  tomSugerido: z.string().max(10).optional(),
})

export type CriarSolicitacaoDto = z.infer<typeof CriarSolicitacaoSchema>

export const AprovarSolicitacaoSchema = z.object({
  tom: z.string().min(1, "Tom e obrigatorio para aprovar o vinculo").max(10),
})

export type AprovarSolicitacaoDto = z.infer<typeof AprovarSolicitacaoSchema>

// ── Saída ─────────────────────────────────────────────────────────────────────

export interface SolicitacaoResponseDto {
  id: string
  musicaId: string
  musicaTitulo: string
  musicaArtista: string | null
  cantorId: string
  cantorNome: string
  cantorFoto: string | null
  tomSugerido: string | null
  status: string
  criadoEm: string
}
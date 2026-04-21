// src/dtos/culto/criar-culto.dto.ts
import { z } from "zod"

export const LimiteInstrumentoSchema = z.object({
  instrumento: z.string().min(1),
  limite: z.number().int().min(1).default(1),
})

export const CriarCultoSchema = z.object({
  tipo: z.enum([
    "CULTO_DOMINGO_MANHA",
    "CULTO_DOMINGO_NOITE",
    "CULTO_SEMANA",
    "ENSAIO",
    "SEMANA_ORACAO",
    "ESPECIAL",
    "OUTRO",
  ]),
  subtipo: z.string().optional(),
  dataHoraInicio: z.string().datetime("Data/hora de inicio invalida"),
  dataHoraFim: z.string().datetime().optional(),
  cantorId: z.string().cuid().optional(),
  inscricoesAbertas: z.boolean().default(true),
  prazoCancelamentoHoras: z.number().int().min(0).default(48),
  repetirSemanal: z.boolean().default(false),
  observacoesInternas: z.string().optional(),
  limites: z.array(LimiteInstrumentoSchema).default([]),
})

export type CriarCultoDto = z.infer<typeof CriarCultoSchema>

export const AtualizarCultoSchema = CriarCultoSchema.partial().extend({
  status: z.enum(["ABERTO", "FECHADO", "REALIZADO"]).optional(),
})

export type AtualizarCultoDto = z.infer<typeof AtualizarCultoSchema>

// Inscricao
export const InscricaoCultoSchema = z.object({
  instrumento: z.string().min(1, "Instrumento obrigatorio"),
  fazBacking: z.boolean().default(false),
  comoInstrumentista: z.boolean().default(false),
  // Apenas admin: inscrever outro membro no lugar do solicitante
  membroIdAlvo: z.string().cuid().optional(),
  // Apenas admin: ignora verificacoes de status e inscricoes abertas
  forcarInscricao: z.boolean().default(false),
})

export type InscricaoCultoDto = z.infer<typeof InscricaoCultoSchema>
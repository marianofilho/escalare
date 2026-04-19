// src/dtos/repertorio/criar-repertorio.dto.ts
import { z } from "zod"

// cantorId vem da page (derivado das inscrições do culto)
export const CriarRepertorioSchema = z.object({
  cantorId: z.string().cuid("ID do cantor inválido"),
})
export type CriarRepertorioDto = z.infer<typeof CriarRepertorioSchema>

export const AdicionarItemSchema = z.object({
  musicaId: z.string().cuid("ID de música inválido"),
  ordem: z.number().int().min(1).optional(),
  observacoes: z.string().max(500).optional(),
})
export type AdicionarItemDto = z.infer<typeof AdicionarItemSchema>

export const AtualizarItemSchema = z.object({
  ordem: z.number().int().min(1).optional(),
  observacoes: z.string().max(500).optional(),
})
export type AtualizarItemDto = z.infer<typeof AtualizarItemSchema>
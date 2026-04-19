// src/dtos/musica/criar-musica.dto.ts
import { z } from "zod"

export const CriarMusicaSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório").max(200),
  artista: z.string().max(100).optional(),
  bpm: z.number().int().min(1).max(300).optional(),
  linkVideo: z.string().url("Link de vídeo inválido").optional().or(z.literal("")),
  linkCifra: z.string().url("Link de cifra inválido").optional().or(z.literal("")),
  linkPartitura: z.string().url("Link de partitura inválido").optional().or(z.literal("")),
})
export type CriarMusicaDto = z.infer<typeof CriarMusicaSchema>

export const AtualizarMusicaSchema = CriarMusicaSchema.partial().extend({
  status: z.enum(["ATIVA", "ARQUIVADA"]).optional(),
})
export type AtualizarMusicaDto = z.infer<typeof AtualizarMusicaSchema>

// Vínculo cantor — sem linkSolo/linkPlayback (viraram MusicaFaixa)
export const VincularCantorSchema = z.object({
  cantorId: z.string().cuid("ID do cantor inválido"),
  tom: z.string().min(1, "Tom obrigatório").max(10),
})
export type VincularCantorDto = z.infer<typeof VincularCantorSchema>

export const AtualizarCantorSchema = z.object({
  tom: z.string().min(1, "Tom obrigatório").max(10),
})
export type AtualizarCantorDto = z.infer<typeof AtualizarCantorSchema>

// Faixa de instrumento
export const CriarFaixaSchema = z.object({
  instrumento: z.string().min(1, "Instrumento obrigatório").max(50),
  linkAudio: z.string().url("Link de áudio inválido"),
})
export type CriarFaixaDto = z.infer<typeof CriarFaixaSchema>

export const AtualizarFaixaSchema = CriarFaixaSchema.partial()
export type AtualizarFaixaDto = z.infer<typeof AtualizarFaixaSchema>
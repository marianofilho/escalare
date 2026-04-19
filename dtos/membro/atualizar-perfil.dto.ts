// src/dtos/membro/atualizar-perfil.dto.ts
import { z } from "zod"

export const AtualizarPerfilSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100).optional(),
  telefone: z.string().optional(),
  instrumentoPrincipal: z.string().optional(),
  instrumentoSecundario: z.string().optional(),
  fazBackingVocal: z.boolean().optional(),
  fotoPerfil: z.string().url("URL inválida").optional().or(z.literal("")),
})

export type AtualizarPerfilDto = z.infer<typeof AtualizarPerfilSchema>
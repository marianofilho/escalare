// src/dtos/membro/criar-membro.dto.ts
import { z } from "zod"

export const CriarMembroSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional(),
  perfil: z.enum(["ADMINISTRADOR", "CANTOR", "MUSICO", "BACKING_VOCAL"], {
    errorMap: () => ({ message: "Perfil inválido" }),
  }),
  instrumentoPrincipal: z.string().optional(),
  instrumentoSecundario: z.string().optional(),
  fazBackingVocal: z.boolean().default(false),
  dataIngresso: z.string().datetime().optional(),
})

export type CriarMembroDto = z.infer<typeof CriarMembroSchema>

export const AtualizarMembroSchema = CriarMembroSchema.partial().extend({
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
})

export type AtualizarMembroDto = z.infer<typeof AtualizarMembroSchema>
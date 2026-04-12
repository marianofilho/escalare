import { z } from "zod"

export const CadastroSchema = z.object({
  // Dados da Igreja
  igrejaSlug: z
    .string()
    .min(3, "Identificador deve ter no mínimo 3 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  igrejaNome: z.string().min(2, "Nome da igreja obrigatório").max(100),

  // Dados do Admin
  nome: z.string().min(2, "Nome obrigatório").max(100),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmacaoSenha: z.string(),
}).refine((data) => data.senha === data.confirmacaoSenha, {
  message: "As senhas não coincidem",
  path: ["confirmacaoSenha"],
})

export type CadastroDto = z.infer<typeof CadastroSchema>
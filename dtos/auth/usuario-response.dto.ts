import type { Membro, Igreja } from "@prisma/client"

export interface UsuarioResponseDto {
  id: string
  nome: string
  email: string
  perfil: string
  status: string
  igrejaId: string
  igrejaNome: string
}

export type MembroComIgreja = Membro & { igreja: Igreja }

export function toUsuarioResponseDto(membro: MembroComIgreja): UsuarioResponseDto {
  return {
    id: membro.id,
    nome: membro.nome,
    email: membro.email,
    perfil: membro.perfil,
    status: membro.status,
    igrejaId: membro.igrejaId,
    igrejaNome: membro.igreja.nome,
  }
}
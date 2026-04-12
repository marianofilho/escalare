import type { Usuario, Igreja } from "@prisma/client"

export interface UsuarioResponseDto {
  id: string
  nome: string
  email: string
  perfil: string
  status: string
  igrejaId: string
  igrejaNome: string
}

type UsuarioComIgreja = Usuario & { igreja: Igreja }

export function toUsuarioResponseDto(usuario: UsuarioComIgreja): UsuarioResponseDto {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    status: usuario.status,
    igrejaId: usuario.igrejaId,
    igrejaNome: usuario.igreja.nome,
  }
}
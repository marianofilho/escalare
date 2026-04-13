// src/dtos/membro/membro-response.dto.ts
import type { Membro } from "@prisma/client"

export class MembroResponseDto {
  id: string
  nome: string
  email: string
  telefone: string | null
  fotoPerfil: string | null
  perfil: string
  instrumentoPrincipal: string | null
  instrumentoSecundario: string | null
  fazBackingVocal: boolean
  status: string
  dataIngresso: string | null
  criadoEm: string

  static from(membro: Membro): MembroResponseDto {
    return {
      id: membro.id,
      nome: membro.nome,
      email: membro.email,
      telefone: membro.telefone ?? null,
      fotoPerfil: membro.fotoPerfil ?? null,
      perfil: membro.perfil,
      instrumentoPrincipal: membro.instrumentoPrincipal ?? null,
      instrumentoSecundario: membro.instrumentoSecundario ?? null,
      fazBackingVocal: membro.fazBackingVocal,
      status: membro.status,
      dataIngresso: membro.dataIngresso?.toISOString() ?? null,
      criadoEm: membro.criadoEm.toISOString(),
    }
  }
}
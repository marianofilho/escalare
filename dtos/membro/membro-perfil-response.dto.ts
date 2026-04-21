// src/dtos/membro/membro-perfil-response.dto.ts

export interface CultoHistoricoDto {
  cultoId: string
  tipo: string
  subtipo: string | null
  dataHoraInicio: string
  status: string
  instrumento: string
  fazBacking: boolean
  ausente: boolean
}

export interface MusicaVinculadaDto {
  musicaId: string
  titulo: string
  artista: string | null
  tom: string
  statusMusica: string
}

export interface MembroPerfilResponseDto {
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
  totalCultos: number
  cultosRecentes: CultoHistoricoDto[]
  musicasVinculadas: MusicaVinculadaDto[]
}
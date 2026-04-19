// src/services/auth.service.ts
import type { SupabaseClient } from "@supabase/supabase-js"
import { MembroRepository } from "@/repositories/membro.repository"
import {
  CredenciaisInvalidasError,
  NaoAutorizadoError,
  UsuarioNaoEncontradoError,
} from "@/types/errors"
import {
  toUsuarioResponseDto,
  type UsuarioResponseDto,
} from "@/dtos/auth/usuario-response.dto"
import type { LoginDto } from "@/dtos/auth/login.dto"

export class AuthService {
  constructor(private readonly membroRepository: MembroRepository) {}

  async login(
    dto: LoginDto,
    supabase: SupabaseClient
  ): Promise<{ usuario: UsuarioResponseDto; accessToken: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.senha,
    })

    if (error || !data.session) throw new CredenciaisInvalidasError()

    const membro = await this.membroRepository.findBySupabaseId(data.user.id)
    if (!membro) {
      await supabase.auth.signOut()
      throw new NaoAutorizadoError()
    }

    // Sincroniza user_metadata com os dados atuais do banco
    // Garante que igrejaId, membroId e perfil estão sempre atualizados
    await supabase.auth.updateUser({
      data: {
        nome: membro.nome,
        igrejaId: membro.igrejaId,
        membroId: membro.id,
        perfil: membro.perfil,
      },
    })

    return {
      usuario: toUsuarioResponseDto(membro),
      accessToken: data.session.access_token,
    }
  }

  async logout(supabase: SupabaseClient): Promise<void> {
    await supabase.auth.signOut()
  }

  async me(supabaseId: string): Promise<UsuarioResponseDto> {
    const membro = await this.membroRepository.findBySupabaseId(supabaseId)
    if (!membro) throw new UsuarioNaoEncontradoError(supabaseId)
    return toUsuarioResponseDto(membro)
  }
}

export const authService = new AuthService(new MembroRepository())
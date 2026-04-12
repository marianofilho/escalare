import type { SupabaseClient } from "@supabase/supabase-js"
import { UsuarioRepository } from "@/repositories/usuario.repository"
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
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async login(
    dto: LoginDto,
    supabase: SupabaseClient
  ): Promise<{ usuario: UsuarioResponseDto; accessToken: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.senha,
    })

    if (error || !data.session) {
      throw new CredenciaisInvalidasError()
    }

    const usuario = await this.usuarioRepository.findBySupabaseId(data.user.id)
    if (!usuario) {
      // Usuário existe no Supabase Auth mas não no banco da aplicação
      await supabase.auth.signOut()
      throw new NaoAutorizadoError()
    }

    return {
      usuario: toUsuarioResponseDto(usuario),
      accessToken: data.session.access_token,
    }
  }

  async logout(supabase: SupabaseClient): Promise<void> {
    await supabase.auth.signOut()
  }

  async me(supabaseId: string): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarioRepository.findBySupabaseId(supabaseId)
    if (!usuario) throw new UsuarioNaoEncontradoError(supabaseId)
    return toUsuarioResponseDto(usuario)
  }
}

// Instância singleton do service (injeção manual)
export const authService = new AuthService(new UsuarioRepository())
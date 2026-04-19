// src/services/cadastro.service.ts
import type { SupabaseClient } from "@supabase/supabase-js"
import { IgrejaRepository } from "@/repositories/igreja.repository"
import { MembroRepository } from "@/repositories/membro.repository"
import type { CadastroDto } from "@/dtos/auth/cadastro.dto"
import type { CadastroResponseDto } from "@/dtos/auth/cadastro-response.dto"
import { prisma } from "@/lib/prisma"

export class SlugJaExisteError extends Error {
  constructor(slug: string) {
    super(`O identificador "${slug}" já está em uso. Escolha outro.`)
    this.name = "SlugJaExisteError"
  }
}

export class CadastroSupabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CadastroSupabaseError"
  }
}

export class CadastroService {
  constructor(
    private readonly igrejaRepository: IgrejaRepository,
    private readonly membroRepository: MembroRepository
  ) {}

  async cadastrar(dto: CadastroDto, supabase: SupabaseClient): Promise<CadastroResponseDto> {
    const slugExistente = await this.igrejaRepository.findBySlug(dto.igrejaSlug)
    if (slugExistente) throw new SlugJaExisteError(dto.igrejaSlug)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.senha,
      options: { data: { nome: dto.nome } },
    })

    if (authError || !authData.user) {
      throw new CadastroSupabaseError(
        authError?.message ?? "Erro ao criar conta. Tente novamente."
      )
    }

    const supabaseId = authData.user.id

    const { igreja, membro } = await prisma.$transaction(async (tx) => {
      const igreja = await tx.igreja.create({
        data: { nome: dto.igrejaNome, slug: dto.igrejaSlug },
      })
      const membro = await tx.membro.create({
        data: {
          supabaseId,
          nome: dto.nome,
          email: dto.email,
          perfil: "ADMINISTRADOR",
          igrejaId: igreja.id,
        },
      })
      return { igreja, membro }
    })

    // Grava igrejaId, membroId e perfil no user_metadata
    await supabase.auth.updateUser({
      data: {
        nome: membro.nome,
        igrejaId: igreja.id,
        membroId: membro.id,
        perfil: membro.perfil,
      },
    })

    return {
      igrejaId: igreja.id,
      igrejaNome: igreja.nome,
      usuarioId: membro.id,
      nome: membro.nome,
      email: membro.email,
    }
  }
}

export const cadastroService = new CadastroService(
  new IgrejaRepository(),
  new MembroRepository()
)
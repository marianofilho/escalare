// src/repositories/membro.repository.ts
import { prisma } from "@/lib/prisma"
import type { CriarMembroDto, AtualizarMembroDto } from "@/dtos/membro/criar-membro.dto"
import type { MembroComIgreja } from "@/dtos/auth/usuario-response.dto"

export class MembroRepository {
  async findById(id: string, igrejaId: string) {
    return prisma.membro.findFirst({
      where: { id, igrejaId },
    })
  }

  async findByEmail(email: string, igrejaId: string) {
    return prisma.membro.findUnique({
      where: { email_igrejaId: { email, igrejaId } },
    })
  }

  async findBySupabaseId(supabaseId: string): Promise<MembroComIgreja | null> {
    return prisma.membro.findUnique({
      where: { supabaseId },
      include: { igreja: true },
    })
  }

  async listarPorIgreja(
    igrejaId: string,
    filtros?: { status?: "ATIVO" | "INATIVO"; perfil?: string }
  ) {
    return prisma.membro.findMany({
      where: {
        igrejaId,
        ...(filtros?.status ? { status: filtros.status } : {}),
        ...(filtros?.perfil ? { perfil: filtros.perfil as any } : {}),
      },
      orderBy: { nome: "asc" },
    })
  }

  async criar(data: CriarMembroDto & { igrejaId: string }) {
    return prisma.membro.create({
      data: {
        igrejaId: data.igrejaId,
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        perfil: data.perfil,
        instrumentoPrincipal: data.instrumentoPrincipal,
        instrumentoSecundario: data.instrumentoSecundario,
        fazBackingVocal: data.fazBackingVocal,
        dataIngresso: data.dataIngresso ? new Date(data.dataIngresso) : undefined,
      },
    })
  }

  async atualizar(id: string, igrejaId: string, data: AtualizarMembroDto) {
    return prisma.membro.update({
      where: { id },
      data: {
        ...data,
        dataIngresso: data.dataIngresso ? new Date(data.dataIngresso) : undefined,
      },
    })
  }

  async atualizarSupabaseId(id: string, igrejaId: string, supabaseId: string) {
    return prisma.membro.update({
      where: { id },
      data: { supabaseId },
    })
  }

  async inativar(id: string, igrejaId: string) {
    return prisma.membro.update({
      where: { id },
      data: { status: "INATIVO" },
    })
  }
}
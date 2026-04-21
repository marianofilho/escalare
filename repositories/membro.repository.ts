// src/repositories/membro.repository.ts
import { prisma } from "@/lib/prisma"
import type { CriarMembroDto, AtualizarMembroDto } from "@/dtos/membro/criar-membro.dto"
import type { MembroComIgreja } from "@/dtos/auth/usuario-response.dto"
import {
  ITENS_POR_PAGINA,
  calcularSkip,
  montarPaginacao,
  type PaginacaoDto,
} from "@/dtos/paginacao.dto"

type MembroRow = Awaited<ReturnType<typeof prisma.membro.findFirst>> & {}

export class MembroRepository {
  async findById(id: string, igrejaId: string) {
    return prisma.membro.findFirst({
      where: { id, igrejaId },
    })
  }

  async findByIdComHistorico(id: string, igrejaId: string) {
    return prisma.membro.findFirst({
      where: { id, igrejaId },
      include: {
        inscricoes: {
          orderBy: { culto: { dataHoraInicio: "desc" } },
          take: 20,
          include: {
            culto: {
              select: {
                id: true,
                tipo: true,
                subtipo: true,
                dataHoraInicio: true,
                status: true,
              },
            },
          },
        },
        tomsCantor: {
          include: {
            musica: {
              select: { id: true, titulo: true, artista: true, status: true },
            },
          },
          orderBy: { musica: { titulo: "asc" } },
        },
      },
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

  // Sem paginação — para uso interno (services, emails, etc.)
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

  // Com paginação — para a API REST
  async listarPaginado(
    igrejaId: string,
    filtros?: { status?: "ATIVO" | "INATIVO"; perfil?: string },
    pagina = 1
  ): Promise<PaginacaoDto<NonNullable<MembroRow>>> {
    const where = {
      igrejaId,
      ...(filtros?.status ? { status: filtros.status } : {}),
      ...(filtros?.perfil ? { perfil: filtros.perfil as any } : {}),
    }

    const porPagina = ITENS_POR_PAGINA
    const [data, total] = await prisma.$transaction([
      prisma.membro.findMany({
        where,
        orderBy: { nome: "asc" },
        skip: calcularSkip(pagina, porPagina),
        take: porPagina,
      }),
      prisma.membro.count({ where }),
    ])

    return montarPaginacao(data, total, pagina, porPagina)
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
    return prisma.membro.update({ where: { id }, data: { supabaseId } })
  }

  async inativar(id: string, igrejaId: string) {
    return prisma.membro.update({ where: { id }, data: { status: "INATIVO" } })
  }
}
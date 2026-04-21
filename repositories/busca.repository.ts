// src/repositories/busca.repository.ts
import { prisma } from "@/lib/prisma"

const TIPO_LABEL: Record<string, string> = {
  CULTO_DOMINGO_MANHA: "Culto Domingo Manha",
  CULTO_DOMINGO_NOITE: "Culto Domingo Noite",
  CULTO_SEMANA: "Culto de Semana",
  ENSAIO: "Ensaio",
  SEMANA_ORACAO: "Semana de Oracao",
  ESPECIAL: "Culto Especial",
  OUTRO: "Outro",
}

export interface ResultadoBusca {
  membros: {
    id: string
    nome: string
    email: string
    perfil: string
    fotoPerfil: string | null
  }[]
  musicas: {
    id: string
    titulo: string
    artista: string | null
    status: string
  }[]
  cultos: {
    id: string
    tipo: string
    subtipo: string | null
    dataHoraInicio: string
    status: string
  }[]
}

export class BuscaRepository {
  async buscar(igrejaId: string, q: string): Promise<ResultadoBusca> {
    const modo = { contains: q, mode: "insensitive" as const }

    const [membros, musicas, cultos] = await prisma.$transaction([
      prisma.membro.findMany({
        where: {
          igrejaId,
          status: "ATIVO",
          OR: [{ nome: modo }, { email: modo }],
        },
        select: { id: true, nome: true, email: true, perfil: true, fotoPerfil: true },
        orderBy: { nome: "asc" },
        take: 5,
      }),
      prisma.musica.findMany({
        where: {
          igrejaId,
          status: "ATIVA",
          OR: [{ titulo: modo }, { artista: modo }],
        },
        select: { id: true, titulo: true, artista: true, status: true },
        orderBy: { titulo: "asc" },
        take: 5,
      }),
      prisma.culto.findMany({
        where: {
          igrejaId,
          OR: [
            { subtipo: modo },
          ],
        },
        select: { id: true, tipo: true, subtipo: true, dataHoraInicio: true, status: true },
        orderBy: { dataHoraInicio: "desc" },
        take: 5,
      }),
    ])

    return {
      membros,
      musicas,
      cultos: cultos.map((c) => ({
        ...c,
        tipo: TIPO_LABEL[c.tipo] ?? c.tipo,
        dataHoraInicio: c.dataHoraInicio.toISOString(),
      })),
    }
  }
}
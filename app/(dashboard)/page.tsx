// src/app/(dashboard)/page.tsx
import { getServerSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardClient from "@/components/dashboard/DashboardClient"

export default async function DashboardPage() {
  const user = await getServerSession()
  if (!user) redirect("/login")

  const igrejaId = user.user_metadata?.igrejaId as string | undefined
  if (!igrejaId) redirect("/login")

  const [totalMembros, totalMusicas, proximosCultos, igreja] = await Promise.all([
    prisma.membro.count({ where: { igrejaId, status: "ATIVO" } }),
    prisma.musica.count({ where: { igrejaId, status: "ATIVA" } }),
    prisma.culto.findMany({
      where: {
        igrejaId,
        status: { in: ["ABERTO", "FECHADO"] },
        dataHoraInicio: { gte: new Date() },
      },
      orderBy: { dataHoraInicio: "asc" },
      take: 3,
      include: {
        inscricoes: { include: { membro: { select: { nome: true } } } },
      },
    }),
    prisma.igreja.findUnique({ where: { id: igrejaId } }),
  ])

  const nomeMembro = user.user_metadata?.nome as string | undefined

  return (
    <DashboardClient
      nomeMembro={nomeMembro ?? ""}
      nomeIgreja={igreja?.nome ?? ""}
      totalMembros={totalMembros}
      totalMusicas={totalMusicas}
      proximosCultos={proximosCultos}
    />
  )
}
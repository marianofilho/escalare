// src/app/(dashboard)/cultos/[id]/editar/page.tsx
import Link from "next/link"
import { getServerSession } from "@/lib/supabase-server"
import { redirect, notFound } from "next/navigation"
import { makeMembroService, makeCultoService } from "@/lib/factories"
import { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import { NaoEncontradoError } from "@/types/errors"
import CultoForm from "@/components/cultos/CultoForm"

interface Props { params: Promise<{ id: string }> }

export default async function EditarCultoPage({ params }: Props) {
  const { id } = await params

  const user = await getServerSession()
  if (!user) redirect("/login")

  const igrejaId = user.user_metadata?.igrejaId as string
  const membroId = user.user_metadata?.membroId as string

  const membroService = makeMembroService()
  const membroAtual = await membroService.buscarPorId(membroId, igrejaId)
  if (membroAtual.perfil !== "ADMINISTRADOR") redirect("/cultos")

  let cultoDto: CultoResponseDto
  let tipoCulto: string

  try {
    const culto = await makeCultoService().buscarPorId(id, igrejaId)
    cultoDto = CultoResponseDto.from(culto)
    tipoCulto = formatarTipoCulto(culto.tipo)
  } catch (e) {
    if (e instanceof NaoEncontradoError) notFound()
    throw e
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/cultos" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            ← Voltar para cultos
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mt-2">Editar culto</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{tipoCulto}</p>
        </div>
        <CultoForm culto={cultoDto} />
      </div>
    </div>
  )
}

function formatarTipoCulto(tipo: string) {
  const mapa: Record<string, string> = {
    CULTO_DOMINGO_MANHA: "Culto Domingo Manhã",
    CULTO_DOMINGO_NOITE: "Culto Domingo Noite",
    CULTO_SEMANA: "Culto de Semana",
    ENSAIO: "Ensaio",
    SEMANA_ORACAO: "Semana de Oração",
    ESPECIAL: "Culto Especial",
    OUTRO: "Outro",
  }
  return mapa[tipo] ?? tipo
}
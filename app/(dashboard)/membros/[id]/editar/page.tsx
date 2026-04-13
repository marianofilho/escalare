// src/app/(dashboard)/membros/[id]/editar/page.tsx
import Link from "next/link"
import { getServerSession } from "@/lib/supabase-server"
import { redirect, notFound } from "next/navigation"
import MembroForm from "@/components/membros/MembroForm"
import { makeMembroService } from "@/lib/factories"
import { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import { NaoEncontradoError } from "@/types/errors"

interface EditarMembroPageProps {
  params: { id: string }
}

export default async function EditarMembroPage({ params }: EditarMembroPageProps) {
  const user = await getServerSession()
  if (!user) redirect("/login")

  const igrejaId = user.user_metadata?.igrejaId as string

  try {
    const service = makeMembroService()
    const membro = await service.buscarPorId(params.id, igrejaId)
    const membroDto = MembroResponseDto.from(membro)

    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="mb-8">
            <Link
              href="/membros"
              className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              ← Voltar para membros
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900 mt-2">
              Editar membro
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">{membro.nome}</p>
          </div>
          <MembroForm membro={membroDto} />
        </div>
      </div>
    )
  } catch (error) {
    if (error instanceof NaoEncontradoError) notFound()
    throw error
  }
}
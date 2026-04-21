// src/components/membros/MembroLista.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Paginacao from "@/components/ui/Paginacao"
import type { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import type { PaginacaoDto } from "@/dtos/paginacao.dto"

const PERFIL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  CANTOR: "Cantor(a)",
  MUSICO: "Musico",
  BACKING_VOCAL: "Backing Vocal",
}

const PERFIL_COR: Record<string, string> = {
  ADMINISTRADOR: "bg-red-100 text-red-700",
  CANTOR: "bg-violet-100 text-violet-700",
  MUSICO: "bg-sky-100 text-sky-700",
  BACKING_VOCAL: "bg-emerald-100 text-emerald-700",
}

interface MembroListaProps {
  isAdmin: boolean
}

export default function MembroLista({ isAdmin }: MembroListaProps) {
  const [resultado, setResultado] = useState<PaginacaoDto<MembroResponseDto> | null>(null)
  const [pagina, setPagina] = useState(1)
  const [filtroStatus, setFiltroStatus] = useState<"ATIVO" | "INATIVO">("ATIVO")
  const [filtroPerfil, setFiltroPerfil] = useState("")
  const [busca, setBusca] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("pagina", String(pagina))
      if (filtroStatus) params.set("status", filtroStatus)
      if (filtroPerfil) params.set("perfil", filtroPerfil)
      const res = await fetch(`/api/membros?${params}`)
      if (!res.ok) throw new Error("Erro ao carregar membros")
      setResultado(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [pagina, filtroStatus, filtroPerfil])

  useEffect(() => { carregar() }, [carregar])

  // Reseta para página 1 quando filtros mudam
  function setFiltro(fn: () => void) {
    fn()
    setPagina(1)
  }

  const membros = resultado?.data ?? []
  const membrosFiltrados = busca
    ? membros.filter(
        (m) =>
          m.nome.toLowerCase().includes(busca.toLowerCase()) ||
          m.email.toLowerCase().includes(busca.toLowerCase())
      )
    : membros

  async function handleInativar(id: string) {
    if (!confirm("Deseja inativar este membro?")) return
    await fetch(`/api/membros/${id}`, { method: "DELETE" })
    carregar()
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <select
          value={filtroPerfil}
          onChange={(e) => setFiltro(() => setFiltroPerfil(e.target.value))}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Todos os perfis</option>
          <option value="ADMINISTRADOR">Administrador</option>
          <option value="CANTOR">Cantor(a)</option>
          <option value="MUSICO">Musico</option>
          <option value="BACKING_VOCAL">Backing Vocal</option>
        </select>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
          {(["ATIVO", "INATIVO"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(() => setFiltroStatus(s))}
              className={`px-4 py-2 transition-colors ${
                filtroStatus === s
                  ? "bg-violet-600 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s === "ATIVO" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-zinc-400 text-sm">Carregando membros...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {!loading && !error && membrosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-sm">Nenhum membro encontrado.</p>
          {isAdmin && (
            <Link href="/membros/novo" className="mt-2 inline-block text-sm text-violet-600 hover:underline">
              Cadastrar primeiro membro
            </Link>
          )}
        </div>
      )}

      {!loading && membrosFiltrados.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Membro</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 hidden sm:table-cell">Perfil</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 hidden md:table-cell">Instrumento</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {membrosFiltrados.map((m) => (
                <MembroRow key={m.id} membro={m} isAdmin={isAdmin} onInativar={handleInativar} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resultado && resultado.totalPaginas > 1 && (
        <Paginacao
          pagina={resultado.pagina}
          totalPaginas={resultado.totalPaginas}
          total={resultado.total}
          porPagina={20}
          onChange={(p) => setPagina(p)}
        />
      )}
    </div>
  )
}

function MembroRow({ membro, isAdmin, onInativar }: {
  membro: MembroResponseDto
  isAdmin: boolean
  onInativar: (id: string) => void
}) {
  const iniciais = membro.nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()

  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/membros/${membro.id}`} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 shrink-0">
            {iniciais}
          </div>
          <div>
            <p className="font-medium text-zinc-800 group-hover:text-violet-700 transition-colors">{membro.nome}</p>
            <p className="text-xs text-zinc-400">{membro.email}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERFIL_COR[membro.perfil]}`}>
          {PERFIL_LABEL[membro.perfil] ?? membro.perfil}
        </span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-zinc-500">
        {membro.instrumentoPrincipal ?? <span className="text-zinc-300">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/membros/${membro.id}`} className="text-xs text-zinc-400 hover:text-violet-600 transition-colors">Ver →</Link>
          {isAdmin && (
            <>
              <Link href={`/membros/${membro.id}/editar`} className="text-xs text-violet-600 hover:text-violet-800 transition-colors">Editar</Link>
              {membro.status === "ATIVO" && (
                <button onClick={() => onInativar(membro.id)} className="text-xs text-zinc-400 hover:text-red-600 transition-colors">Inativar</button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
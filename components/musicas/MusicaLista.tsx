// src/components/musicas/MusicaLista.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"

interface MusicaListaProps {
  isAdmin: boolean
}

const STATUS_COR: Record<string, string> = {
  ATIVA: "bg-emerald-100 text-emerald-700",
  ARQUIVADA: "bg-zinc-100 text-zinc-500",
}

export default function MusicaLista({ isAdmin }: MusicaListaProps) {
  const [musicas, setMusicas] = useState<MusicaResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("ATIVA")
  const [buscaDebounced, setBuscaDebounced] = useState("")

  // Debounce na busca para não disparar request a cada tecla
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 350)
    return () => clearTimeout(t)
  }, [busca])

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filtroStatus) params.set("status", filtroStatus)
      if (buscaDebounced) params.set("busca", buscaDebounced)
      const res = await fetch(`/api/musicas?${params}`)
      if (!res.ok) throw new Error("Erro ao carregar músicas")
      setMusicas(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [filtroStatus, buscaDebounced])

  useEffect(() => { carregar() }, [carregar])

  async function handleArquivar(id: string) {
    if (!confirm("Arquivar esta música? Ela não aparecerá em novos repertórios.")) return
    await fetch(`/api/musicas/${id}`, { method: "DELETE" })
    carregar()
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por título ou artista..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
          {(["ATIVA", "ARQUIVADA", ""] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-4 py-2 transition-colors ${
                filtroStatus === s
                  ? "bg-violet-600 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s === "ATIVA" ? "Ativas" : s === "ARQUIVADA" ? "Arquivadas" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="text-center py-12 text-zinc-400 text-sm">Carregando músicas...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {!loading && !error && musicas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-sm">Nenhuma música encontrada.</p>
          <Link
            href="/musicas/nova"
            className="mt-2 inline-block text-sm text-violet-600 hover:underline"
          >
            Cadastrar primeira música
          </Link>
        </div>
      )}

      {/* Grade de cards */}
      {!loading && musicas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {musicas.map((m) => (
            <MusicaCard key={m.id} musica={m} isAdmin={isAdmin} onArquivar={handleArquivar} />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-400 text-right">
        {musicas.length} música{musicas.length !== 1 ? "s" : ""}
      </p>
    </div>
  )
}

function MusicaCard({
  musica,
  isAdmin,
  onArquivar,
}: {
  musica: MusicaResponseDto
  isAdmin: boolean
  onArquivar: (id: string) => void
}) {
  const corStatus = STATUS_COR[musica.status] ?? "bg-zinc-100 text-zinc-500"

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 hover:border-violet-300 hover:shadow-sm transition-all">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-800 truncate">{musica.titulo}</p>
          {musica.artista && (
            <p className="text-xs text-zinc-400 truncate mt-0.5">{musica.artista}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${corStatus}`}>
          {musica.status === "ATIVA" ? "Ativa" : "Arquivada"}
        </span>
      </div>

      {/* Metadados */}
      <div className="flex flex-wrap gap-2">
        {musica.bpm && (
          <span className="text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-0.5 text-zinc-500">
            🥁 {musica.bpm} BPM
          </span>
        )}
        {musica.linkVideo && (
          <a
            href={musica.linkVideo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-0.5 text-violet-600 hover:text-violet-800 transition-colors"
          >
            ▶ Vídeo
          </a>
        )}
        {musica.linkCifra && (
          <a
            href={musica.linkCifra}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-0.5 text-violet-600 hover:text-violet-800 transition-colors"
          >
            🎸 Cifra
          </a>
        )}
        {musica.linkPartitura && (
          <a
            href={musica.linkPartitura}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-0.5 text-violet-600 hover:text-violet-800 transition-colors"
          >
            🎼 Partitura
          </a>
        )}
      </div>

      {/* Cantores vinculados */}
      {musica.cantores.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-100">
          {musica.cantores.map((c) => (
            <div
              key={c.cantorId}
              className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5"
            >
              <div className="w-4 h-4 rounded-full bg-violet-200 flex items-center justify-center text-xs font-semibold text-violet-700">
                {c.cantorNome[0].toUpperCase()}
              </div>
              <span className="text-xs text-violet-700">{c.cantorNome.split(" ")[0]}</span>
              <span className="text-xs text-violet-400">· {c.tom}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ações — visíveis apenas para administrador */}
      {isAdmin && (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100">
          <Link
            href={`/musicas/${musica.id}/editar`}
            className="text-xs text-violet-600 hover:text-violet-800 transition-colors"
          >
            Editar
          </Link>
          {musica.status === "ATIVA" && (
            <button
              onClick={() => onArquivar(musica.id)}
              className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
            >
              Arquivar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
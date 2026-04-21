// src/components/musicas/MusicaLista.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"
import type { SolicitacaoResponseDto } from "@/dtos/solicitacao/solicitacao.dto"

interface MusicaListaProps {
  isAdmin: boolean
  isCantor: boolean
  membroId: string
}

const STATUS_COR: Record<string, string> = {
  ATIVA: "bg-emerald-100 text-emerald-700",
  ARQUIVADA: "bg-zinc-100 text-zinc-500",
}

export default function MusicaLista({ isAdmin, isCantor, membroId }: MusicaListaProps) {
  const [musicas, setMusicas] = useState<MusicaResponseDto[]>([])
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("ATIVA")
  const [buscaDebounced, setBuscaDebounced] = useState("")

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

      const reqs: Promise<Response>[] = [fetch(`/api/musicas?${params}`)]
      // Cantor busca suas solicitações para saber o estado de cada música
      if (isCantor) reqs.push(fetch("/api/solicitacoes"))

      const resps = await Promise.all(reqs)
      if (!resps[0].ok) throw new Error("Erro ao carregar musicas")

      setMusicas(await resps[0].json())
      if (resps[1]?.ok) setSolicitacoes(await resps[1].json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [filtroStatus, buscaDebounced, isCantor])

  useEffect(() => { carregar() }, [carregar])

  async function handleArquivar(id: string) {
    if (!confirm("Arquivar esta musica?")) return
    await fetch(`/api/musicas/${id}`, { method: "DELETE" })
    carregar()
  }

  async function handleRestaurar(id: string) {
    if (!confirm("Restaurar esta musica?")) return
    const res = await fetch(`/api/musicas/${id}/restaurar`, { method: "PATCH" })
    if (!res.ok) { const d = await res.json(); alert(d.error ?? "Erro"); return }
    carregar()
  }

  async function handleSolicitar(musicaId: string, tomSugerido?: string) {
    const res = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musicaId, tomSugerido: tomSugerido || undefined }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error ?? "Erro ao solicitar vinculo"); return }
    setSolicitacoes((prev) => [...prev, data])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por titulo ou artista..."
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
                filtroStatus === s ? "bg-violet-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s === "ATIVA" ? "Ativas" : s === "ARQUIVADA" ? "Arquivadas" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-12 text-zinc-400 text-sm">Carregando musicas...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {!loading && !error && musicas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-sm">
            {filtroStatus === "ARQUIVADA" ? "Nenhuma musica arquivada." : "Nenhuma musica encontrada."}
          </p>
          {isAdmin && filtroStatus !== "ARQUIVADA" && (
            <Link href="/musicas/nova" className="mt-2 inline-block text-sm text-violet-600 hover:underline">
              Cadastrar primeira musica
            </Link>
          )}
        </div>
      )}

      {!loading && musicas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {musicas.map((m) => (
            <MusicaCard
              key={m.id}
              musica={m}
              isAdmin={isAdmin}
              isCantor={isCantor}
              membroId={membroId}
              solicitacoes={solicitacoes}
              onArquivar={handleArquivar}
              onRestaurar={handleRestaurar}
              onSolicitar={handleSolicitar}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-400 text-right">
        {musicas.length} musica{musicas.length !== 1 ? "s" : ""}
      </p>
    </div>
  )
}

function BotaoSolicitar({
  musicaId,
  onSolicitar,
}: {
  musicaId: string
  onSolicitar: (musicaId: string, tom?: string) => Promise<void>
}) {
  const [aberto, setAberto] = useState(false)
  const [tom, setTom] = useState("")
  const [enviando, setEnviando] = useState(false)

  const TONS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
                "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"]

  async function handleConfirmar() {
    setEnviando(true)
    await onSolicitar(musicaId, tom || undefined)
    setEnviando(false)
    setAberto(false)
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
      >
        + Solicitar vinculo
      </button>
    )
  }

  return (
    <div className="space-y-2 pt-1">
      <select
        value={tom}
        onChange={(e) => setTom(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <option value="">Tom (opcional)</option>
        {TONS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <div className="flex gap-2">
        <button
          onClick={handleConfirmar}
          disabled={enviando}
          className="flex-1 text-xs py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {enviando ? "Enviando..." : "Solicitar"}
        </button>
        <button
          onClick={() => setAberto(false)}
          className="text-xs px-2 text-zinc-400 hover:text-zinc-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function MusicaCard({
  musica,
  isAdmin,
  isCantor,
  membroId,
  solicitacoes,
  onArquivar,
  onRestaurar,
  onSolicitar,
}: {
  musica: MusicaResponseDto
  isAdmin: boolean
  isCantor: boolean
  membroId: string
  solicitacoes: SolicitacaoResponseDto[]
  onArquivar: (id: string) => void
  onRestaurar: (id: string) => void
  onSolicitar: (musicaId: string, tom?: string) => Promise<void>
}) {
  const corStatus = STATUS_COR[musica.status] ?? "bg-zinc-100 text-zinc-500"

  const jaVinculado = musica.cantores.some((c) => c.cantorId === membroId)
  const solicitacao = solicitacoes.find((s) => s.musicaId === musica.id)

  return (
    <div className={`bg-white border rounded-xl p-4 flex flex-col gap-3 transition-all ${
      musica.status === "ARQUIVADA"
        ? "border-zinc-200 opacity-75 hover:opacity-100"
        : "border-zinc-200 hover:border-violet-300 hover:shadow-sm"
    }`}>
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

      <div className="flex flex-wrap gap-2">
        {musica.bpm && (
          <span className="text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-0.5 text-zinc-500">
            🥁 {musica.bpm} BPM
          </span>
        )}
        {musica.linkVideo && (
          <a href={musica.linkVideo} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-0.5 text-violet-600 hover:text-violet-800 transition-colors">
            ▶ Video
          </a>
        )}
        {musica.linkCifra && (
          <a href={musica.linkCifra} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-0.5 text-violet-600 hover:text-violet-800 transition-colors">
            🎸 Cifra
          </a>
        )}
        {musica.linkPartitura && (
          <a href={musica.linkPartitura} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-zinc-50 border border-zinc-100 rounded-md px-2 py-0.5 text-violet-600 hover:text-violet-800 transition-colors">
            🎼 Partitura
          </a>
        )}
      </div>

      {musica.cantores.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-100">
          {musica.cantores.map((c) => (
            <div key={c.cantorId}
              className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 border ${
                c.cantorId === membroId
                  ? "bg-violet-100 border-violet-200"
                  : "bg-violet-50 border-violet-100"
              }`}>
              <div className="w-4 h-4 rounded-full bg-violet-200 flex items-center justify-center text-xs font-semibold text-violet-700">
                {c.cantorNome[0].toUpperCase()}
              </div>
              <span className="text-xs text-violet-700">{c.cantorNome.split(" ")[0]}</span>
              <span className="text-xs text-violet-400">· {c.tom}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100">
        {/* Ações do cantor */}
        {isCantor && !isAdmin && musica.status === "ATIVA" && (
          jaVinculado ? (
            <span className="text-xs text-emerald-600 font-medium">✓ Vinculado</span>
          ) : solicitacao ? (
            <span className={`text-xs font-medium ${
              solicitacao.status === "PENDENTE" ? "text-amber-500" :
              solicitacao.status === "RECUSADA" ? "text-red-400" : "text-emerald-600"
            }`}>
              {solicitacao.status === "PENDENTE" ? "⏳ Aguardando" :
               solicitacao.status === "RECUSADA" ? "✗ Recusado" : "✓ Aprovado"}
            </span>
          ) : (
            <BotaoSolicitar musicaId={musica.id} onSolicitar={onSolicitar} />
          )
        )}

        {/* Ações do admin */}
        {isAdmin && (
          musica.status === "ATIVA" ? (
            <>
              <Link href={`/musicas/${musica.id}/editar`}
                className="text-xs text-violet-600 hover:text-violet-800 transition-colors">
                Editar
              </Link>
              <button onClick={() => onArquivar(musica.id)}
                className="text-xs text-zinc-400 hover:text-red-600 transition-colors">
                Arquivar
              </button>
            </>
          ) : (
            <button onClick={() => onRestaurar(musica.id)}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium transition-colors">
              ↩ Restaurar
            </button>
          )
        )}
      </div>
    </div>
  )
}
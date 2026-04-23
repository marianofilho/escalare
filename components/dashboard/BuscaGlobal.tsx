// src/components/dashboard/BuscaGlobal.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { ResultadoBusca } from "@/repositories/busca.repository"

const PERFIL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Admin",
  CANTOR: "Cantor(a)",
  MUSICO: "Musico",
  BACKING_VOCAL: "BV",
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

interface BuscaGlobalProps {
  onFechar?: () => void
}

export default function BuscaGlobal({ onFechar }: BuscaGlobalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null)
  const [loading, setLoading] = useState(false)
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1)

  // Foca o input ao montar
  useEffect(() => { inputRef.current?.focus() }, [])

  // Debounce da busca
  useEffect(() => {
    if (query.length < 2) { setResultado(null); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(query)}`)
        if (res.ok) setResultado(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Lista plana de resultados para navegação por teclado
  const itens = resultado ? [
    ...resultado.membros.map((m) => ({ tipo: "membro" as const, id: m.id, href: `/membros/${m.id}`, label: m.nome, sub: PERFIL_LABEL[m.perfil] ?? m.perfil })),
    ...resultado.musicas.map((m) => ({ tipo: "musica" as const, id: m.id, href: `/musicas`, label: m.titulo, sub: m.artista ?? "" })),
    ...resultado.cultos.map((c) => ({ tipo: "culto" as const, id: c.id, href: `/cultos/${c.id}`, label: c.tipo, sub: `${c.subtipo ? c.subtipo + " · " : ""}${formatarData(c.dataHoraInicio)}` })),
  ] : []

  const temResultados = itens.length > 0

  function navegar(href: string) {
    router.push(href)
    onFechar?.()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onFechar?.(); return }
    if (e.key === "ArrowDown") { e.preventDefault(); setIndiceSelecionado((i) => Math.min(i + 1, itens.length - 1)); return }
    if (e.key === "ArrowUp") { e.preventDefault(); setIndiceSelecionado((i) => Math.max(i - 1, -1)); return }
    if (e.key === "Enter" && indiceSelecionado >= 0 && itens[indiceSelecionado]) {
      navegar(itens[indiceSelecionado].href)
    }
  }

  return (
    <div className="flex flex-col w-full max-h-[80vh]">
      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
        <span className="text-zinc-400 text-lg shrink-0">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIndiceSelecionado(-1) }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar membros, musicas, cultos..."
          className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {onFechar && (
          <button onClick={onFechar} className="text-xs text-zinc-400 hover:text-zinc-600 shrink-0 px-1.5 py-0.5 border border-zinc-200 rounded">
            Esc
          </button>
        )}
      </div>

      {/* Resultados */}
      <div className="overflow-y-auto">
        {query.length >= 2 && !loading && !temResultados && (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">
            Nenhum resultado para <strong>{query}</strong>
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-6 text-center text-sm text-zinc-400">
            Digite pelo menos 2 caracteres para buscar
          </div>
        )}

        {temResultados && (
          <div className="py-2">
            {/* Membros */}
            {resultado!.membros.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Membros</p>
                {resultado!.membros.map((m) => {
                  const idx = itens.findIndex((i) => i.tipo === "membro" && i.id === m.id)
                  const selecionado = idx === indiceSelecionado
                  const iniciais = m.nome.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase()).join("")
                  return (
                    <button key={m.id} onClick={() => navegar(`/membros/${m.id}`)}
                      onMouseEnter={() => setIndiceSelecionado(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selecionado ? "bg-violet-50" : "hover:bg-zinc-50"}`}>
                      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0 overflow-hidden">
                        {m.fotoPerfil
                          ? <Image src={m.fotoPerfil} alt={m.nome} width={28} height={28} className="object-cover" />
                          : iniciais}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">{m.nome}</p>
                        <p className="text-xs text-zinc-400 truncate">{PERFIL_LABEL[m.perfil] ?? m.perfil} · {m.email}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Músicas */}
            {resultado!.musicas.length > 0 && (
              <div className={resultado!.membros.length > 0 ? "border-t border-zinc-100 mt-1 pt-1" : ""}>
                <p className="px-4 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Musicas</p>
                {resultado!.musicas.map((m) => {
                  const idx = itens.findIndex((i) => i.tipo === "musica" && i.id === m.id)
                  const selecionado = idx === indiceSelecionado
                  return (
                    <button key={m.id} onClick={() => navegar("/musicas")}
                      onMouseEnter={() => setIndiceSelecionado(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selecionado ? "bg-violet-50" : "hover:bg-zinc-50"}`}>
                      <span className="text-base shrink-0">🎵</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">{m.titulo}</p>
                        {m.artista && <p className="text-xs text-zinc-400 truncate">{m.artista}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Cultos */}
            {resultado!.cultos.length > 0 && (
              <div className={(resultado!.membros.length > 0 || resultado!.musicas.length > 0) ? "border-t border-zinc-100 mt-1 pt-1" : ""}>
                <p className="px-4 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cultos</p>
                {resultado!.cultos.map((c) => {
                  const idx = itens.findIndex((i) => i.tipo === "culto" && i.id === c.id)
                  const selecionado = idx === indiceSelecionado
                  return (
                    <button key={c.id} onClick={() => navegar(`/cultos/${c.id}`)}
                      onMouseEnter={() => setIndiceSelecionado(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selecionado ? "bg-violet-50" : "hover:bg-zinc-50"}`}>
                      <span className="text-base shrink-0">📅</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {c.tipo}{c.subtipo ? ` — ${c.subtipo}` : ""}
                        </p>
                        <p className="text-xs text-zinc-400">{formatarData(c.dataHoraInicio)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dica de teclado */}
      {temResultados && (
        <div className="border-t border-zinc-100 px-4 py-2 flex items-center gap-3 text-xs text-zinc-400">
          <span>↑↓ navegar</span>
          <span>↵ selecionar</span>
          <span>Esc fechar</span>
        </div>
      )}
    </div>
  )
}
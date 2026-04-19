// src/components/repertorio/RepertorioEditor.tsx
"use client"

import { useState } from "react"
import type { RepertorioResponseDto, ItemRepertorioResponseDto } from "@/dtos/repertorio/repertorio-response.dto"
import type { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"

interface Props {
  cultoId: string
  cantorId: string           // ID do cantor inscrito (derivado das inscrições na page)
  repertorio: RepertorioResponseDto | null
  musicasDisponiveis: MusicaResponseDto[]
}

export default function RepertorioEditor({ cultoId, cantorId, repertorio: inicial, musicasDisponiveis }: Props) {
  const [repertorio, setRepertorio] = useState(inicial)
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [removendo, setRemovendo] = useState<string | null>(null)
  const [musicaSelecionada, setMusicaSelecionada] = useState("")
  const [ordem, setOrdem] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [busca, setBusca] = useState("")

  async function recarregar() {
    const res = await fetch(`/api/cultos/${cultoId}/repertorio`)
    if (res.ok) setRepertorio(await res.json())
  }

  async function handleCriar() {
    setCriando(true)
    setErro(null)
    const res = await fetch(`/api/cultos/${cultoId}/repertorio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantorId }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error); setCriando(false); return }
    setRepertorio(data)
    setCriando(false)
  }

  async function handleAdicionar() {
    if (!musicaSelecionada) { setErro("Selecione uma música"); return }
    setAdicionando(true)
    setErro(null)
    const res = await fetch(`/api/cultos/${cultoId}/repertorio/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        musicaId: musicaSelecionada,
        ordem: ordem ? Number(ordem) : undefined,
        observacoes: observacoes || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error); setAdicionando(false); return }
    await recarregar()
    setMusicaSelecionada("")
    setOrdem("")
    setObservacoes("")
    setAdicionando(false)
  }

  async function handleRemover(itemId: string) {
    if (!confirm("Remover esta música do repertório?")) return
    setRemovendo(itemId)
    await fetch(`/api/cultos/${cultoId}/repertorio/itens/${itemId}`, { method: "DELETE" })
    setRepertorio((prev) =>
      prev ? { ...prev, itens: prev.itens.filter((i) => i.id !== itemId) } : prev
    )
    setRemovendo(null)
  }

  const idsNoRepertorio = new Set(repertorio?.itens.map((i) => i.musicaId) ?? [])
  const musicasPendentes = musicasDisponiveis.filter(
    (m) =>
      !idsNoRepertorio.has(m.id) &&
      (busca === "" ||
        m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        (m.artista?.toLowerCase().includes(busca.toLowerCase()) ?? false))
  )

  if (!repertorio) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center space-y-4">
        <p className="text-zinc-500 text-sm">Este culto ainda não tem repertório.</p>
        {cantorId ? (
          <>
            {erro && <p className="text-xs text-red-600">{erro}</p>}
            <button
              onClick={handleCriar}
              disabled={criando}
              className="px-6 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {criando ? "Criando..." : "Criar repertório"}
            </button>
          </>
        ) : (
          <p className="text-xs text-amber-600">
            Nenhum cantor inscrito neste culto. Um membro com perfil{" "}
            <strong>Cantor</strong> precisa se inscrever antes de criar o repertório.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {/* Lista de músicas no repertório */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800">Músicas do repertório</h2>
          <span className="text-xs text-zinc-400">
            {repertorio.itens.length} música{repertorio.itens.length !== 1 ? "s" : ""}
          </span>
        </div>

        {repertorio.itens.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-zinc-400">Nenhuma música adicionada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {repertorio.itens.map((item, idx) => (
              <ItemRepertorioRow
                key={item.id}
                item={item}
                idx={idx}
                removendo={removendo === item.id}
                onRemover={() => handleRemover(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Adicionar música */}
      {musicasDisponiveis.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-700">
          Nenhuma música com tom cadastrado para este cantor. Cadastre os tons em{" "}
          <strong>Músicas → Editar → Cantores e faixas</strong>.
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Adicionar música
          </h2>
          <input
            type="text"
            placeholder="Buscar música..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={inputClass()}
          />
          {musicasPendentes.length === 0 ? (
            <p className="text-sm text-zinc-400">
              {busca ? "Nenhuma música encontrada." : "Todas as músicas já estão no repertório."}
            </p>
          ) : (
            <>
              <select
                value={musicaSelecionada}
                onChange={(e) => setMusicaSelecionada(e.target.value)}
                className={inputClass()}
              >
                <option value="">Selecionar música...</option>
                {musicasPendentes.map((m) => {
                  const tom = m.cantores.find((mc) => mc.cantorId === cantorId)?.tom
                  return (
                    <option key={m.id} value={m.id}>
                      {m.titulo}{m.artista ? ` — ${m.artista}` : ""}{tom ? ` (${tom})` : ""}
                    </option>
                  )
                })}
              </select>
              <div className="flex gap-3">
                <input
                  type="number"
                  min={1}
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value)}
                  placeholder="Ordem (opcional)"
                  className={`${inputClass()} w-40`}
                />
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações (opcional)"
                  className={inputClass()}
                />
              </div>
              <button
                onClick={handleAdicionar}
                disabled={adicionando}
                className="px-5 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {adicionando ? "Adicionando..." : "+ Adicionar ao repertório"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ItemRepertorioRow({ item, idx, removendo, onRemover }: {
  item: ItemRepertorioResponseDto
  idx: number
  removendo: boolean
  onRemover: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="text-xs text-zinc-300 w-5 text-right shrink-0">
        {item.ordem ?? idx + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-zinc-800 truncate">{item.musicaTitulo}</p>
          {item.musicaArtista && (
            <span className="text-xs text-zinc-400 truncate">{item.musicaArtista}</span>
          )}
          <span className="text-xs bg-violet-50 border border-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-mono shrink-0">
            {item.tomUsado}
          </span>
          {item.musicaBpm && (
            <span className="text-xs text-zinc-400 shrink-0">🥁 {item.musicaBpm}</span>
          )}
        </div>
        {item.observacoes && (
          <p className="text-xs text-zinc-400 mt-0.5">{item.observacoes}</p>
        )}
        {item.cantorInfo && item.cantorInfo.faixas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.cantorInfo.faixas.map((f) => (
              <span key={f.id} className="text-xs bg-zinc-50 border border-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                🎵 {f.instrumento}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onRemover}
        disabled={removendo}
        className="text-xs text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
      >
        {removendo ? "..." : "✕"}
      </button>
    </div>
  )
}

function inputClass() {
  return "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-zinc-400 transition-colors hover:border-zinc-300"
}
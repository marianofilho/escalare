// src/components/musicas/MusicaForm.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { CriarMusicaDto } from "@/dtos/musica/criar-musica.dto"
import type { MusicaResponseDto, MusicaCantorResponseDto, MusicaFaixaResponseDto } from "@/dtos/musica/musica-response.dto"
import type { MembroResponseDto } from "@/dtos/membro/membro-response.dto"

interface MusicaFormProps {
  musica?: MusicaResponseDto
}

const TONS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]

const INSTRUMENTOS_SUGERIDOS = [
  "Violão", "Guitarra Ritmo", "Guitarra Solo", "Baixo",
  "Bateria", "Percussão", "Teclado 1", "Teclado 2",
  "Piano", "Violino", "Flauta", "Voz", "Playback",
]

export default function MusicaForm({ musica }: MusicaFormProps) {
  const router = useRouter()
  const isEdicao = Boolean(musica)

  // --- Formulário principal ---
  const [form, setForm] = useState<Partial<CriarMusicaDto>>({
    titulo: musica?.titulo ?? "",
    artista: musica?.artista ?? "",
    bpm: musica?.bpm ?? undefined,
    linkVideo: musica?.linkVideo ?? "",
    linkCifra: musica?.linkCifra ?? "",
    linkPartitura: musica?.linkPartitura ?? "",
  })
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // --- Cantores ---
  const [cantores, setCantores] = useState<MusicaCantorResponseDto[]>(musica?.cantores ?? [])
  const [cantoresDisponiveis, setCantoresDisponiveis] = useState<MembroResponseDto[]>([])
  const [loadingCantores, setLoadingCantores] = useState(false)
  const [novoCantor, setNovoCantor] = useState({ cantorId: "", tom: "C" })
  const [erroCantor, setErroCantor] = useState<string | null>(null)
  const [vinculando, setVinculando] = useState(false)
  const [removendo, setRemovendo] = useState<string | null>(null)

  // --- Faixas ---
  const [novaFaixa, setNovaFaixa] = useState<Record<string, { instrumento: string; linkAudio: string }>>({})
  const [adicionandoFaixa, setAdicionandoFaixa] = useState<string | null>(null)
  const [removendoFaixa, setRemovendoFaixa] = useState<string | null>(null)
  const [erroFaixa, setErroFaixa] = useState<Record<string, string>>({})

  const recarregarMusica = useCallback(async () => {
    if (!musica?.id) return
    const res = await fetch(`/api/musicas/${musica.id}`)
    if (res.ok) {
      const m: MusicaResponseDto = await res.json()
      setCantores(m.cantores)
    }
  }, [musica?.id])

  const carregarCantoresDisponiveis = useCallback(async () => {
    setLoadingCantores(true)
    try {
      const res = await fetch("/api/membros?perfil=CANTOR&status=ATIVO")
      if (res.ok){
        const json = await res.json()
        const lista = Array.isArray(json) ? json : (json.data ?? [])
        setCantoresDisponiveis(lista)      
      } 
        
    } finally {
      setLoadingCantores(false)
    }
  }, [])

  useEffect(() => {
    if (isEdicao) carregarCantoresDisponiveis()
  }, [isEdicao, carregarCantoresDisponiveis])

  function setField<K extends keyof CriarMusicaDto>(campo: K, valor: CriarMusicaDto[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErros((prev) => { const next = { ...prev }; delete next[campo]; return next })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErroGeral(null)
    try {
      const url = isEdicao ? `/api/musicas/${musica!.id}` : "/api/musicas"
      const method = isEdicao ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.status === 422 && data.detalhes) {
        const novosErros: Record<string, string> = {}
        for (const [campo, msgs] of Object.entries(data.detalhes)) {
          novosErros[campo] = (msgs as string[])[0]
        }
        setErros(novosErros)
        return
      }
      if (!res.ok) { setErroGeral(data.error ?? "Erro ao salvar"); return }
      router.push(isEdicao ? "/musicas" : `/musicas/${data.id}/editar`)
      router.refresh()
    } catch {
      setErroGeral("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function handleVincularCantor() {
    if (!novoCantor.cantorId) { setErroCantor("Selecione um cantor"); return }
    setErroCantor(null)
    setVinculando(true)
    try {
      const res = await fetch(`/api/musicas/${musica!.id}/cantores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoCantor),
      })
      const data = await res.json()
      if (!res.ok) { setErroCantor(data.error ?? "Erro ao vincular"); return }
      await recarregarMusica()
      setNovoCantor({ cantorId: "", tom: "C" })
    } finally {
      setVinculando(false)
    }
  }

  async function handleRemoverCantor(cantorId: string) {
    if (!confirm("Remover este cantor e todas as suas faixas desta música?")) return
    setRemovendo(cantorId)
    await fetch(`/api/musicas/${musica!.id}/cantores/${cantorId}`, { method: "DELETE" })
    setCantores((prev) => prev.filter((c) => c.cantorId !== cantorId))
    setRemovendo(null)
  }

  async function handleAdicionarFaixa(cantorId: string) {
    const faixa = novaFaixa[cantorId]
    if (!faixa?.instrumento) {
      setErroFaixa((p) => ({ ...p, [cantorId]: "Informe o instrumento" }))
      return
    }
    if (!faixa?.linkAudio) {
      setErroFaixa((p) => ({ ...p, [cantorId]: "Informe o link do áudio" }))
      return
    }
    setErroFaixa((p) => { const n = { ...p }; delete n[cantorId]; return n })
    setAdicionandoFaixa(cantorId)
    try {
      const res = await fetch(`/api/musicas/${musica!.id}/cantores/${cantorId}/faixas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faixa),
      })
      const data = await res.json()
      if (!res.ok) { setErroFaixa((p) => ({ ...p, [cantorId]: data.error ?? "Erro ao adicionar" })); return }
      await recarregarMusica()
      setNovaFaixa((p) => { const n = { ...p }; delete n[cantorId]; return n })
    } finally {
      setAdicionandoFaixa(null)
    }
  }

  async function handleRemoverFaixa(cantorId: string, faixaId: string) {
    if (!confirm("Remover esta faixa?")) return
    setRemovendoFaixa(faixaId)
    await fetch(`/api/musicas/${musica!.id}/cantores/${cantorId}/faixas/${faixaId}`, { method: "DELETE" })
    setCantores((prev) =>
      prev.map((c) =>
        c.cantorId === cantorId
          ? { ...c, faixas: c.faixas.filter((f) => f.id !== faixaId) }
          : c
      )
    )
    setRemovendoFaixa(null)
  }

  const cantoresJaVinculados = new Set(cantores.map((c) => c.cantorId))
  const cantoresPendentes = cantoresDisponiveis.filter((m) => !cantoresJaVinculados.has(m.id))

  return (
    <div className="space-y-6">
      {/* ---- Formulário principal ---- */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {erroGeral && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {erroGeral}
          </div>
        )}

        <Secao titulo="Dados da música">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Título" erro={erros.titulo} required className="sm:col-span-2">
              <input type="text" value={form.titulo} onChange={(e) => setField("titulo", e.target.value)}
                placeholder="Ex: Oceanos" className={inputClass(erros.titulo)} />
            </Campo>
            <Campo label="Artista / Banda" erro={erros.artista}>
              <input type="text" value={form.artista} onChange={(e) => setField("artista", e.target.value)}
                placeholder="Ex: Hillsong United" className={inputClass(erros.artista)} />
            </Campo>
            <Campo label="BPM" erro={erros.bpm}>
              <input type="number" min={1} max={300} value={form.bpm ?? ""}
                onChange={(e) => setField("bpm", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Ex: 72" className={inputClass(erros.bpm)} />
            </Campo>
          </div>
        </Secao>

        <Secao titulo="Links de referência">
          <Campo label="Vídeo (YouTube, Google Drive...)" erro={erros.linkVideo}>
            <input type="url" value={form.linkVideo} onChange={(e) => setField("linkVideo", e.target.value)}
              placeholder="https://..." className={inputClass(erros.linkVideo)} />
          </Campo>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Cifra" erro={erros.linkCifra}>
              <input type="url" value={form.linkCifra} onChange={(e) => setField("linkCifra", e.target.value)}
                placeholder="https://..." className={inputClass(erros.linkCifra)} />
            </Campo>
            <Campo label="Partitura" erro={erros.linkPartitura}>
              <input type="url" value={form.linkPartitura} onChange={(e) => setField("linkPartitura", e.target.value)}
                placeholder="https://..." className={inputClass(erros.linkPartitura)} />
            </Campo>
          </div>
        </Secao>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? "Salvando..." : isEdicao ? "Salvar alterações" : "Cadastrar música"}
          </button>
        </div>
      </form>

      {/* ---- Painel de cantores e faixas ---- */}
      {isEdicao && (
        <Secao titulo="Cantores e faixas">

          {/* Cantores já vinculados */}
          {cantores.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum cantor vinculado ainda.</p>
          ) : (
            <div className="space-y-4">
              {cantores.map((c) => (
                <CantorFaixasPanel
                  key={c.cantorId}
                  cantor={c}
                  novaFaixa={novaFaixa[c.cantorId] ?? { instrumento: "", linkAudio: "" }}
                  onNovaFaixaChange={(campo, valor) =>
                    setNovaFaixa((p) => ({ ...p, [c.cantorId]: { ...(p[c.cantorId] ?? { instrumento: "", linkAudio: "" }), [campo]: valor } }))
                  }
                  onAdicionarFaixa={() => handleAdicionarFaixa(c.cantorId)}
                  onRemoverFaixa={(faixaId) => handleRemoverFaixa(c.cantorId, faixaId)}
                  onRemoverCantor={() => handleRemoverCantor(c.cantorId)}
                  adicionando={adicionandoFaixa === c.cantorId}
                  removendoFaixa={removendoFaixa}
                  removendo={removendo === c.cantorId}
                  erro={erroFaixa[c.cantorId]}
                />
              ))}
            </div>
          )}

          {/* Vincular novo cantor */}
          <div className="border-t border-zinc-100 pt-4 mt-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Vincular cantor
            </p>
            {loadingCantores && <p className="text-sm text-zinc-400">Carregando cantores...</p>}
            {!loadingCantores && cantoresDisponiveis.length === 0 && (
              <p className="text-sm text-zinc-400">
                Nenhum membro com perfil <strong>Cantor</strong> cadastrado.{" "}
                <Link href="/membros/novo" className="text-violet-600 hover:underline">Cadastrar membro</Link>
              </p>
            )}
            {!loadingCantores && cantoresDisponiveis.length > 0 && cantoresPendentes.length === 0 && (
              <p className="text-sm text-zinc-400">Todos os cantores já estão vinculados.</p>
            )}
            {!loadingCantores && cantoresPendentes.length > 0 && (
              <>
                {erroCantor && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erroCantor}</p>}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select value={novoCantor.cantorId}
                    onChange={(e) => setNovoCantor((p) => ({ ...p, cantorId: e.target.value }))}
                    className={inputClass()}>
                    <option value="">Selecionar cantor...</option>
                    {cantoresPendentes.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                  <select value={novoCantor.tom}
                    onChange={(e) => setNovoCantor((p) => ({ ...p, tom: e.target.value }))}
                    className={`${inputClass()} sm:w-32`}>
                    {TONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button type="button" onClick={handleVincularCantor} disabled={vinculando}
                    className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                    {vinculando ? "Vinculando..." : "+ Vincular"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Secao>
      )}
    </div>
  )
}

// ---- Painel de faixas de um cantor ----

function CantorFaixasPanel({
  cantor, novaFaixa, onNovaFaixaChange,
  onAdicionarFaixa, onRemoverFaixa, onRemoverCantor,
  adicionando, removendoFaixa, removendo, erro,
}: {
  cantor: MusicaCantorResponseDto
  novaFaixa: { instrumento: string; linkAudio: string }
  onNovaFaixaChange: (campo: "instrumento" | "linkAudio", valor: string) => void
  onAdicionarFaixa: () => void
  onRemoverFaixa: (faixaId: string) => void
  onRemoverCantor: () => void
  adicionando: boolean
  removendoFaixa: string | null
  removendo: boolean
  erro?: string
}) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      {/* Cabeçalho do cantor */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-b border-zinc-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">
            {cantor.cantorNome[0].toUpperCase()}
          </div>
          <div>
            <span className="text-sm font-medium text-zinc-800">{cantor.cantorNome}</span>
            <span className="ml-2 text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-mono">{cantor.tom}</span>
          </div>
        </div>
        <button onClick={onRemoverCantor} disabled={removendo}
          className="text-xs text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50">
          {removendo ? "Removendo..." : "Remover cantor"}
        </button>
      </div>

      {/* Faixas existentes */}
      <div className="px-4 py-3 space-y-2">
        {cantor.faixas.length === 0 ? (
          <p className="text-xs text-zinc-400">Nenhuma faixa cadastrada.</p>
        ) : (
          cantor.faixas.map((f) => (
            <FaixaItem
              key={f.id}
              faixa={f}
              onRemover={() => onRemoverFaixa(f.id)}
              removendo={removendoFaixa === f.id}
            />
          ))
        )}

        {/* Formulário nova faixa */}
        <div className="pt-2 border-t border-zinc-100 space-y-2">
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              list={`instrumentos-${cantor.cantorId}`}
              value={novaFaixa.instrumento}
              onChange={(e) => onNovaFaixaChange("instrumento", e.target.value)}
              placeholder="Instrumento (ex: Guitarra Ritmo)"
              className={`${inputClass()} text-xs`}
            />
            <datalist id={`instrumentos-${cantor.cantorId}`}>
              {INSTRUMENTOS_SUGERIDOS.map((i) => <option key={i} value={i} />)}
            </datalist>
            <input
              type="url"
              value={novaFaixa.linkAudio}
              onChange={(e) => onNovaFaixaChange("linkAudio", e.target.value)}
              placeholder="Link Google Drive..."
              className={`${inputClass()} text-xs`}
            />
            <button
              type="button"
              onClick={onAdicionarFaixa}
              disabled={adicionando}
              className="px-3 py-2 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {adicionando ? "..." : "+ Faixa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FaixaItem({
  faixa, onRemover, removendo,
}: {
  faixa: MusicaFaixaResponseDto
  onRemover: () => void
  removendo: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs">🎵</span>
        <span className="text-xs font-medium text-zinc-700 truncate">{faixa.instrumento}</span>
        <a href={faixa.linkAudio} target="_blank" rel="noopener noreferrer"
          className="text-xs text-violet-600 hover:underline shrink-0">
          Ouvir
        </a>
      </div>
      <button onClick={onRemover} disabled={removendo}
        className="text-xs text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0">
        {removendo ? "..." : "✕"}
      </button>
    </div>
  )
}

// ---- Helpers ----

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{titulo}</h3>
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">{children}</div>
    </div>
  )
}

function Campo({ label, erro, required, className, children }: {
  label: string; erro?: string; required?: boolean; className?: string; children: React.ReactNode
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label className="block text-sm font-medium text-zinc-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  )
}

function inputClass(erro?: string) {
  return [
    "w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 bg-white",
    "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent",
    "placeholder:text-zinc-400 transition-colors",
    erro ? "border-red-400" : "border-zinc-200 hover:border-zinc-300",
  ].join(" ")
}
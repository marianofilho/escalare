"use client"
// src/components/solicitacoes/SolicitacoesLista.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { SolicitacaoResponseDto } from "@/dtos/solicitacao/solicitacao.dto"

interface Props {
  inicial: SolicitacaoResponseDto[]
}

const TONS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
              "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"]

function Avatar({ nome, foto }: { nome: string; foto: string | null }) {
  return (
    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0 overflow-hidden">
      {foto
        ? <Image src={foto} alt={nome} width={36} height={36} className="object-cover" />
        : nome[0]?.toUpperCase()
      }
    </div>
  )
}

function SolicitacaoCard({
  s,
  onAprovar,
  onRecusar,
}: {
  s: SolicitacaoResponseDto
  onAprovar: (id: string, tom: string) => Promise<void>
  onRecusar: (id: string) => Promise<void>
}) {
  const [tom, setTom] = useState(s.tomSugerido ?? "")
  const [aprovando, setAprovando] = useState(false)
  const [recusando, setRecusando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleAprovar() {
    if (!tom) { setErro("Selecione o tom para aprovar"); return }
    setAprovando(true)
    setErro(null)
    await onAprovar(s.id, tom)
    setAprovando(false)
  }

  async function handleRecusar() {
    if (!confirm(`Recusar solicitacao de ${s.cantorNome} para "${s.musicaTitulo}"?`)) return
    setRecusando(true)
    await onRecusar(s.id)
    setRecusando(false)
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar nome={s.cantorNome} foto={s.cantorFoto} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-800">{s.cantorNome}</p>
          <p className="text-sm text-zinc-600">
            quer cantar{" "}
            <span className="font-medium text-violet-700">{s.musicaTitulo}</span>
            {s.musicaArtista && (
              <span className="text-zinc-400"> — {s.musicaArtista}</span>
            )}
          </p>
          {s.tomSugerido && (
            <p className="text-xs text-zinc-400 mt-0.5">
              Tom sugerido pelo cantor: <span className="font-medium">{s.tomSugerido}</span>
            </p>
          )}
          <p className="text-xs text-zinc-400 mt-0.5">
            {new Date(s.criadoEm).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {erro && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-zinc-100">
        <select
          value={tom}
          onChange={(e) => { setTom(e.target.value); setErro(null) }}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Definir tom...</option>
          {TONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <button
          onClick={handleAprovar}
          disabled={aprovando || recusando}
          className="px-4 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {aprovando ? "Aprovando..." : "Aprovar"}
        </button>

        <button
          onClick={handleRecusar}
          disabled={aprovando || recusando}
          className="px-4 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {recusando ? "Recusando..." : "Recusar"}
        </button>
      </div>
    </div>
  )
}

export default function SolicitacoesLista({ inicial }: Props) {
  const router = useRouter()
  const [solicitacoes, setSolicitacoes] = useState(inicial)

  async function handleAprovar(id: string, tom: string) {
    const res = await fetch(`/api/solicitacoes/${id}/aprovar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tom }),
    })
    if (res.ok) {
      setSolicitacoes((prev) => prev.filter((s) => s.id !== id))
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error ?? "Erro ao aprovar solicitacao")
    }
  }

  async function handleRecusar(id: string) {
    const res = await fetch(`/api/solicitacoes/${id}/recusar`, { method: "PATCH" })
    if (res.ok) {
      setSolicitacoes((prev) => prev.filter((s) => s.id !== id))
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error ?? "Erro ao recusar solicitacao")
    }
  }

  if (solicitacoes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">✅</p>
        <p className="text-zinc-500 text-sm">Nenhuma solicitacao pendente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {solicitacoes.map((s) => (
        <SolicitacaoCard
          key={s.id}
          s={s}
          onAprovar={handleAprovar}
          onRecusar={handleRecusar}
        />
      ))}
    </div>
  )
}
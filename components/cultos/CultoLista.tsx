// src/components/cultos/CultoLista.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ABERTO: { label: "Aberto", className: "bg-emerald-100 text-emerald-700" },
  FECHADO: { label: "Fechado", className: "bg-amber-100 text-amber-700" },
  REALIZADO: { label: "Realizado", className: "bg-zinc-100 text-zinc-500" },
}

interface CultoListaProps {
  isAdmin: boolean
  membroId: string
}

export default function CultoLista({ isAdmin, membroId }: CultoListaProps) {
  const [cultos, setCultos] = useState<CultoResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState("")
  const [apenasProximos, setApenasProximos] = useState(true)

  const buscar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroStatus) params.set("status", filtroStatus)
    if (apenasProximos) params.set("futuros", "true")
    const res = await fetch(`/api/cultos?${params}`)
    if (res.ok) setCultos(await res.json())
    setLoading(false)
  }, [filtroStatus, apenasProximos])

  useEffect(() => { buscar() }, [buscar])

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Todos os status</option>
          <option value="ABERTO">Aberto</option>
          <option value="FECHADO">Fechado</option>
          <option value="REALIZADO">Realizado</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={apenasProximos}
            onChange={(e) => setApenasProximos(e.target.checked)}
            className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
          />
          Apenas próximos
        </label>
      </div>

      {loading && <p className="text-center py-12 text-zinc-400 text-sm">Carregando cultos...</p>}

      {!loading && cultos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-sm">Nenhum culto encontrado.</p>
          {isAdmin && (
            <Link href="/cultos/novo" className="mt-2 inline-block text-sm text-violet-600 hover:underline">
              Criar primeiro culto
            </Link>
          )}
        </div>
      )}

      {!loading && cultos.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {cultos.map((c) => (
            <CultoCard
              key={c.id}
              culto={c}
              isAdmin={isAdmin}
              membroId={membroId}
              onAtualizar={buscar}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CultoCard({
  culto,
  isAdmin,
  membroId,
  onAtualizar,
}: {
  culto: CultoResponseDto
  isAdmin: boolean
  membroId: string
  onAtualizar: () => void
}) {
  const [inscrevendo, setInscrevendo] = useState(false)
  const [instrumento, setInstrumento] = useState("")
  const [fazBacking, setFazBacking] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarInscricao, setMostrarInscricao] = useState(false)

  const statusInfo = STATUS_LABEL[culto.status] ?? { label: culto.status, className: "bg-zinc-100 text-zinc-500" }

  const jaInscrito = culto.inscricoes.some((i) => i.membroId === membroId)
  const minhaInscricao = culto.inscricoes.find((i) => i.membroId === membroId)

  async function handleInscrever() {
    if (!instrumento) { setErro("Selecione um instrumento"); return }
    setInscrevendo(true)
    setErro(null)
    const res = await fetch(`/api/cultos/${culto.id}/inscricoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instrumento, fazBacking }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error); setInscrevendo(false); return }
    setMostrarInscricao(false)
    onAtualizar()
    setInscrevendo(false)
  }

  async function handleCancelar() {
    if (!confirm("Cancelar inscrição?")) return
    await fetch(`/api/cultos/${culto.id}/inscricoes`, { method: "DELETE" })
    onAtualizar()
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg shrink-0">🎤</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-zinc-800">{formatarTipoCulto(culto.tipo)}</p>
              {culto.subtipo && <span className="text-xs text-zinc-400">— {culto.subtipo}</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{formatarDataHora(culto.dataHoraInicio)}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {culto.totalInscritos} inscrito{culto.totalInscritos !== 1 ? "s" : ""}
              {culto.limites.length > 0 && (
                <span className="ml-2 text-zinc-400">
                  · {culto.limites.map((l) => `${l.instrumento}: ${l.inscritos}/${l.limite}`).join(", ")}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {culto.status === "ABERTO" && culto.inscricoesAbertas && (
            jaInscrito ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full">
                  ✓ {minhaInscricao?.instrumento}
                </span>
                <button
                  onClick={handleCancelar}
                  className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMostrarInscricao(!mostrarInscricao)}
                className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Inscrever-se
              </button>
            )
          )}
          {isAdmin && (
            <Link
              href={`/cultos/${culto.id}/editar`}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Painel de inscrição inline */}
      {mostrarInscricao && !jaInscrito && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 space-y-3">
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={instrumento}
              onChange={(e) => setInstrumento(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Selecionar instrumento...</option>
              {["Violão", "Guitarra", "Baixo", "Bateria", "Teclado", "Piano", "Voz", "Outro"].map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={fazBacking}
                onChange={(e) => setFazBacking(e.target.checked)}
                className="rounded border-zinc-300 text-violet-600"
              />
              Backing vocal
            </label>
            <button
              onClick={handleInscrever}
              disabled={inscrevendo}
              className="px-4 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {inscrevendo ? "Inscrevendo..." : "Confirmar inscrição"}
            </button>
            <button
              onClick={() => setMostrarInscricao(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Inscritos */}
      {culto.inscricoes.length > 0 && (
        <div className="border-t border-zinc-100 px-4 py-2 flex flex-wrap gap-2">
          {culto.inscricoes.map((i) => (
            <div
              key={i.id}
              className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 ${
                i.membroId === membroId
                  ? "bg-violet-50 border-violet-200"
                  : "bg-zinc-50 border-zinc-100"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">
                {i.membroNome[0].toUpperCase()}
              </div>
              <span className="text-xs text-zinc-600">{i.membroNome.split(" ")[0]}</span>
              <span className="text-xs text-zinc-400">· {i.instrumento}</span>
              {i.fazBacking && <span className="text-xs text-emerald-500">BV</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
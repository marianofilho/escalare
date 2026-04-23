// src/components/cultos/CultoLista.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Paginacao from "@/components/ui/Paginacao"
import type { CultoResponseDto } from "@/dtos/culto/culto-response.dto"
import type { PaginacaoDto } from "@/dtos/paginacao.dto"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ABERTO: { label: "Aberto", className: "bg-emerald-100 text-emerald-700" },
  FECHADO: { label: "Fechado", className: "bg-amber-100 text-amber-700" },
  REALIZADO: { label: "Realizado", className: "bg-zinc-100 text-zinc-500" },
}

interface CultoListaProps {
  isAdmin: boolean
  membroId: string
  isCantor?: boolean
}

export default function CultoLista({ isAdmin, membroId, isCantor = false }: CultoListaProps) {
  const [resultado, setResultado] = useState<PaginacaoDto<CultoResponseDto> | null>(null)
  const [pagina, setPagina] = useState(1)
  const [filtroStatus, setFiltroStatus] = useState("")
  const [apenasProximos, setApenasProximos] = useState(true)
  const [loading, setLoading] = useState(true)

  const buscar = useCallback(async () => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const params = new URLSearchParams()
    params.set("pagina", String(pagina))
    if (filtroStatus) params.set("status", filtroStatus)
    if (apenasProximos) params.set("futuros", "true")
    const res = await fetch(`/api/cultos?${params}`)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (res.ok) setResultado(await res.json())
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false)
  }, [pagina, filtroStatus, apenasProximos])

  useEffect(() => { buscar() }, [buscar])

  function setFiltroComReset(fn: () => void) {
    fn()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPagina(1)
  }

  const cultos = resultado?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filtroStatus} onChange={(e) => setFiltroComReset(() => setFiltroStatus(e.target.value))}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">Todos os status</option>
          <option value="ABERTO">Aberto</option>
          <option value="FECHADO">Fechado</option>
          <option value="REALIZADO">Realizado</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
          <input type="checkbox" checked={apenasProximos}
            onChange={(e) => setFiltroComReset(() => setApenasProximos(e.target.checked))}
            className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500" />
          Apenas proximos
        </label>
      </div>

      {loading && <p className="text-center py-12 text-zinc-400 text-sm">Carregando cultos...</p>}

      {!loading && cultos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-sm">Nenhum culto encontrado.</p>
          {isAdmin && (
            <Link href="/cultos/novo" className="mt-2 inline-block text-sm text-violet-600 hover:underline">Criar primeiro culto</Link>
          )}
        </div>
      )}

      {!loading && cultos.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {cultos.map((c) => (
            <CultoCard key={c.id} culto={c} isAdmin={isAdmin} isCantor={isCantor}
              membroId={membroId} onAtualizar={buscar} />
          ))}
        </div>
      )}

      {resultado && resultado.totalPaginas > 1 && (
        <Paginacao pagina={resultado.pagina} totalPaginas={resultado.totalPaginas}
          total={resultado.total} porPagina={20} onChange={(p) => setPagina(p)} />
      )}
    </div>
  )
}

function CultoCard({ culto, isAdmin, isCantor, membroId, onAtualizar }: {
  culto: CultoResponseDto; isAdmin: boolean; isCantor: boolean; membroId: string; onAtualizar: () => void
}) {
  const [inscrevendo, setInscrevendo] = useState(false)
  const [instrumento, setInstrumento] = useState("")
  const [fazBacking, setFazBacking] = useState(false)
  const [comoInstrumentista, setComoInstrumentista] = useState(false)
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
      body: JSON.stringify({ instrumento, fazBacking, comoInstrumentista }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error); setInscrevendo(false); return }
    setMostrarInscricao(false)
    onAtualizar()
    setInscrevendo(false)
  }

  async function handleCancelar() {
    if (!confirm("Cancelar inscricao?")) return
    await fetch(`/api/cultos/${culto.id}/inscricoes`, { method: "DELETE" })
    onAtualizar()
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-violet-200 transition-colors">
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg shrink-0">🎤</div>
          <div className="min-w-0">
            <Link href={`/cultos/${culto.id}`} className="group flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-zinc-800 group-hover:text-violet-700 transition-colors">{formatarTipoCulto(culto.tipo)}</p>
              {culto.subtipo && <span className="text-xs text-zinc-400">— {culto.subtipo}</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
            </Link>
            <p className="text-xs text-zinc-400 mt-0.5">{formatarDataHora(culto.dataHoraInicio)}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {culto.totalInscritos} inscrito{culto.totalInscritos !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {culto.status === "ABERTO" && culto.inscricoesAbertas && (
            jaInscrito ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full">
                  ✓ {minhaInscricao?.instrumento}{minhaInscricao?.comoInstrumentista && " (inst.)"}
                </span>
                <button onClick={handleCancelar} className="text-xs text-zinc-400 hover:text-red-600 transition-colors">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setMostrarInscricao(!mostrarInscricao)}
                className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                Inscrever-se
              </button>
            )
          )}
          <Link href={`/cultos/${culto.id}`} className="text-xs text-zinc-400 hover:text-violet-600 transition-colors">Ver →</Link>
          {isAdmin && <Link href={`/cultos/${culto.id}/editar`} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Editar</Link>}
        </div>
      </div>

      {mostrarInscricao && !jaInscrito && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 space-y-3">
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={instrumento} onChange={(e) => setInstrumento(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">Selecionar instrumento...</option>
              {["Violao","Guitarra","Baixo","Bateria","Teclado","Piano","Voz","Outro"].map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
              <input type="checkbox" checked={fazBacking} onChange={(e) => setFazBacking(e.target.checked)}
                className="rounded border-zinc-300 text-violet-600" />
              Backing vocal
            </label>
            {isCantor && (
              <label className="flex items-center gap-2 text-xs text-amber-700 cursor-pointer bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg">
                <input type="checkbox" checked={comoInstrumentista} onChange={(e) => setComoInstrumentista(e.target.checked)}
                  className="rounded border-amber-300 text-amber-600" />
                Participar so como instrumentista
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleInscrever} disabled={inscrevendo}
              className="px-4 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {inscrevendo ? "Inscrevendo..." : "Confirmar inscricao"}
            </button>
            <button onClick={() => setMostrarInscricao(false)} className="text-xs text-zinc-400 hover:text-zinc-600">Cancelar</button>
          </div>
        </div>
      )}

      {culto.inscricoes.length > 0 && (
        <div className="border-t border-zinc-100 px-4 py-2 flex flex-wrap gap-2">
          {culto.inscricoes.map((i) => (
            <div key={i.id} className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 ${i.membroId === membroId ? "bg-violet-50 border-violet-200" : "bg-zinc-50 border-zinc-100"}`}>
              <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">{i.membroNome[0].toUpperCase()}</div>
              <span className="text-xs text-zinc-600">{i.membroNome.split(" ")[0]}</span>
              <span className="text-xs text-zinc-400">· {i.instrumento}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
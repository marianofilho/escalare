"use client"
// src/components/cultos/CultoDetalhe.tsx

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { CultoResponseDto, InscricaoResponseDto } from "@/dtos/culto/culto-response.dto"
import type { MembroResponseDto } from "@/dtos/membro/membro-response.dto"

const TIPO_LABEL: Record<string, string> = {
  CULTO_DOMINGO_MANHA: "Culto Domingo Manha",
  CULTO_DOMINGO_NOITE: "Culto Domingo Noite",
  CULTO_SEMANA: "Culto de Semana",
  ENSAIO: "Ensaio",
  SEMANA_ORACAO: "Semana de Oracao",
  ESPECIAL: "Especial",
  OUTRO: "Outro",
}

const STATUS_COR: Record<string, string> = {
  ABERTO: "bg-emerald-100 text-emerald-700",
  FECHADO: "bg-amber-100 text-amber-700",
  REALIZADO: "bg-zinc-100 text-zinc-500",
}

const STATUS_LABEL: Record<string, string> = {
  ABERTO: "Aberto",
  FECHADO: "Fechado",
  REALIZADO: "Realizado",
}

const INSTRUMENTOS = ["Violao", "Guitarra", "Baixo", "Bateria", "Teclado", "Piano", "Voz", "Outro"]

function formatarDataCompleta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

interface RepertorioResumido {
  id: string
  cantorNome: string
  totalMusicas: number
}

interface CultoDetalheProps {
  culto: CultoResponseDto
  repertorio: RepertorioResumido | null
  membroId: string
  isAdmin: boolean
  isCantor?: boolean
  membrosDisponiveis?: MembroResponseDto[]
}

function Avatar({ nome, foto, destaque }: { nome: string; foto: string | null; destaque?: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ${
      destaque ? "bg-violet-200 text-violet-800 ring-2 ring-violet-400" : "bg-zinc-200 text-zinc-600"
    }`}>
      {foto
        ? <Image src={foto} alt={nome} width={32} height={32} className="object-cover" />
        : nome[0].toUpperCase()}
    </div>
  )
}

function InscritoCard({
  inscricao, isMe, isAdmin, onAusenciaToggle, onCancelarAdmin,
}: {
  inscricao: InscricaoResponseDto
  isMe: boolean
  isAdmin: boolean
  onAusenciaToggle: (membroId: string, ausente: boolean) => Promise<void>
  onCancelarAdmin: (membroId: string) => Promise<void>
}) {
  const [toggling, setToggling] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  async function handleToggle() {
    setToggling(true)
    await onAusenciaToggle(inscricao.membroId, !inscricao.ausente)
    setToggling(false)
  }

  async function handleCancelar() {
    if (!confirm(`Cancelar inscricao de ${inscricao.membroNome}?`)) return
    setCancelando(true)
    await onCancelarAdmin(inscricao.membroId)
    setCancelando(false)
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
      inscricao.ausente ? "bg-red-50 border-red-100 opacity-60"
      : isMe ? "bg-violet-50 border-violet-200"
      : "bg-white border-zinc-100"
    }`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar nome={inscricao.membroNome} foto={inscricao.membroFoto} destaque={isMe} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 truncate">
            {inscricao.membroNome}
            {isMe && <span className="ml-1.5 text-xs text-violet-500 font-normal">(voce)</span>}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-zinc-400">{inscricao.instrumento}</span>
            {inscricao.fazBacking && <span className="text-xs bg-emerald-100 text-emerald-600 px-1.5 rounded-full">BV</span>}
            {inscricao.comoInstrumentista && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 rounded-full">Instrumentista</span>}
            {inscricao.ausente && <span className="text-xs bg-red-100 text-red-500 px-1.5 rounded-full">Ausente</span>}
          </div>
        </div>
      </div>
      {isAdmin && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleToggle} disabled={toggling}
            className={`text-xs px-2 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
              inscricao.ausente ? "border-zinc-200 text-zinc-500 hover:bg-zinc-50" : "border-amber-200 text-amber-600 hover:bg-amber-50"
            }`}>
            {toggling ? "..." : inscricao.ausente ? "Presente" : "Ausente"}
          </button>
          <button onClick={handleCancelar} disabled={cancelando}
            className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
            {cancelando ? "..." : "Remover"}
          </button>
        </div>
      )}
    </div>
  )
}

function PainelInscricaoAdmin({
  membrosDisponiveis,
  inscricoes,
  onInscrever,
}: {
  membrosDisponiveis: MembroResponseDto[]
  inscricoes: InscricaoResponseDto[]
  onInscrever: (membroIdAlvo: string, instrumento: string, fazBacking: boolean, comoInstrumentista: boolean) => Promise<void>
}) {
  const [membroSelecionado, setMembroSelecionado] = useState("")
  const [instrumento, setInstrumento] = useState("")
  const [fazBacking, setFazBacking] = useState(false)
  const [comoInstrumentista, setComoInstrumentista] = useState(false)
  const [inscrevendo, setInscrevendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)

  const membrosNaoInscritos = membrosDisponiveis.filter(
    (m) => !inscricoes.some((i) => i.membroId === m.id)
  )

  async function handleInscrever() {
    if (!membroSelecionado) { setErro("Selecione um membro"); return }
    if (!instrumento) { setErro("Selecione um instrumento"); return }
    setInscrevendo(true)
    setErro(null)
    await onInscrever(membroSelecionado, instrumento, fazBacking, comoInstrumentista)
    setMembroSelecionado("")
    setInstrumento("")
    setFazBacking(false)
    setComoInstrumentista(false)
    setAberto(false)
    setInscrevendo(false)
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-sm px-4 py-2 border border-violet-200 text-violet-600 rounded-xl hover:bg-violet-50 transition-colors"
      >
        + Inscrever membro
      </button>
    )
  }

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-violet-800">Inscrever membro</p>

      {erro && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
      )}

      {membrosNaoInscritos.length === 0 ? (
        <p className="text-sm text-zinc-400">Todos os membros ativos ja estao inscritos.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={membroSelecionado} onChange={(e) => { setMembroSelecionado(e.target.value); setErro(null) }}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">Selecionar membro...</option>
              {membrosNaoInscritos.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
            <select value={instrumento} onChange={(e) => { setInstrumento(e.target.value); setErro(null) }}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">Selecionar instrumento...</option>
              {INSTRUMENTOS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
              <input type="checkbox" checked={fazBacking} onChange={(e) => setFazBacking(e.target.checked)}
                className="rounded border-zinc-300 text-violet-600" />
              Backing vocal
            </label>
            <label className="flex items-center gap-2 text-xs text-amber-700 cursor-pointer">
              <input type="checkbox" checked={comoInstrumentista} onChange={(e) => setComoInstrumentista(e.target.checked)}
                className="rounded border-amber-300 text-amber-600" />
              So como instrumentista
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleInscrever} disabled={inscrevendo}
              className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {inscrevendo ? "Inscrevendo..." : "Confirmar"}
            </button>
            <button onClick={() => { setAberto(false); setErro(null) }}
              className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CultoDetalhe({
  culto, repertorio, membroId, isAdmin, isCantor = false, membrosDisponiveis = [],
}: CultoDetalheProps) {
  const router = useRouter()
  const [inscricoes, setInscricoes] = useState<InscricaoResponseDto[]>(culto.inscricoes)
  const [inscrevendo, setInscrevendo] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [instrumento, setInstrumento] = useState("")
  const [fazBacking, setFazBacking] = useState(false)
  const [comoInstrumentista, setComoInstrumentista] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const jaInscrito = inscricoes.some((i) => i.membroId === membroId)
  const minhaInscricao = inscricoes.find((i) => i.membroId === membroId)
  const corStatus = STATUS_COR[culto.status] ?? "bg-zinc-100 text-zinc-500"
  const tipoLabel = TIPO_LABEL[culto.tipo] ?? culto.tipo
  const titulo = culto.subtipo ? `${tipoLabel} — ${culto.subtipo}` : tipoLabel

  async function handleInscrever() {
    if (!instrumento) { setErro("Selecione um instrumento"); return }
    setInscrevendo(true); setErro(null)
    const res = await fetch(`/api/cultos/${culto.id}/inscricoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instrumento, fazBacking, comoInstrumentista }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error); setInscrevendo(false); return }
    setInscricoes((prev) => [...prev, {
      id: data.id, membroId, membroNome: data.membroNome ?? "Voce",
      membroFoto: null, membroPerfil: data.membroPerfil ?? "MUSICO",
      instrumento, fazBacking, ausente: false, comoInstrumentista,
    }])
    setMostrarForm(false); setInstrumento(""); setInscrevendo(false)
    router.refresh()
  }

  async function handleCancelar() {
    if (!confirm("Cancelar inscricao neste culto?")) return
    setCancelando(true)
    const res = await fetch(`/api/cultos/${culto.id}/inscricoes`, { method: "DELETE" })
    if (res.ok) setInscricoes((prev) => prev.filter((i) => i.membroId !== membroId))
    else alert((await res.json()).error ?? "Erro ao cancelar")
    setCancelando(false); router.refresh()
  }

  async function handleAusenciaToggle(mId: string, ausente: boolean) {
    const res = await fetch(`/api/cultos/${culto.id}/inscricoes/${mId}/ausencia`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ausente }),
    })
    if (res.ok) setInscricoes((prev) => prev.map((i) => (i.membroId === mId ? { ...i, ausente } : i)))
  }

  async function handleCancelarAdmin(mIdAlvo: string) {
    const res = await fetch(`/api/cultos/${culto.id}/inscricoes/${mIdAlvo}`, { method: "DELETE" })
    if (res.ok) {
      setInscricoes((prev) => prev.filter((i) => i.membroId !== mIdAlvo))
      router.refresh()
    } else {
      alert((await res.json()).error ?? "Erro ao remover inscricao")
    }
  }

  async function handleInscreverAdmin(
    membroIdAlvo: string,
    inst: string,
    backing: boolean,
    instrumentista: boolean
  ) {
    const res = await fetch(`/api/cultos/${culto.id}/inscricoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membroIdAlvo,
        instrumento: inst,
        fazBacking: backing,
        comoInstrumentista: instrumentista,
        forcarInscricao: true,
      }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error ?? "Erro ao inscrever membro"); return }

    const membro = membrosDisponiveis.find((m) => m.id === membroIdAlvo)
    if (membro) {
      setInscricoes((prev) => [...prev, {
        id: data.id,
        membroId: membro.id,
        membroNome: membro.nome,
        membroFoto: membro.fotoPerfil ?? null,
        membroPerfil: membro.perfil,
        instrumento: inst,
        fazBacking: backing,
        ausente: false,
        comoInstrumentista: instrumentista,
      }])
    }
    router.refresh()
  }

  const podeInscrever = culto.status === "ABERTO" && culto.inscricoesAbertas && !jaInscrito
  const porInstrumento = inscricoes.reduce<Record<string, InscricaoResponseDto[]>>((acc, i) => {
    acc[i.instrumento] = [...(acc[i.instrumento] ?? []), i]
    return acc
  }, {})

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/cultos" className="hover:text-violet-600 transition-colors">Cultos</Link>
        <span>/</span>
        <span className="text-zinc-600 font-medium truncate">{titulo}</span>
      </nav>

      {/* Cabecalho */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-900">{titulo}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${corStatus}`}>
                {STATUS_LABEL[culto.status] ?? culto.status}
              </span>
            </div>
            <p className="text-sm text-zinc-500 capitalize">
              {formatarDataCompleta(culto.dataHoraInicio)}
              {culto.dataHoraFim && <span className="text-zinc-400"> ate {formatarHora(culto.dataHoraFim)}</span>}
            </p>
          </div>
          {isAdmin && (
            <Link href={`/cultos/${culto.id}/editar`}
              className="text-sm px-4 py-2 border border-zinc-200 rounded-xl text-zinc-600 hover:border-violet-300 hover:text-violet-700 transition-colors">
              Editar
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-zinc-100 flex-wrap">
          <div className="text-center">
            <p className="text-xl font-bold text-zinc-900">{inscricoes.length}</p>
            <p className="text-xs text-zinc-400">inscritos</p>
          </div>
          {culto.limites.map((l) => {
            const inscritos = inscricoes.filter((i) => i.instrumento === l.instrumento).length
            return (
              <div key={l.instrumento} className="text-center">
                <p className={`text-xl font-bold ${inscritos >= l.limite ? "text-red-500" : "text-zinc-900"}`}>
                  {inscritos}/{l.limite}
                </p>
                <p className="text-xs text-zinc-400">{l.instrumento}</p>
              </div>
            )
          })}
        </div>

        {isAdmin && culto.observacoesInternas && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
            {culto.observacoesInternas}
          </div>
        )}
      </div>

      {/* Repertorio */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-3">Repertorio</h2>
        {repertorio ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-700">
              {repertorio.totalMusicas} musica{repertorio.totalMusicas !== 1 ? "s" : ""}
              <span className="text-zinc-400"> · por {repertorio.cantorNome}</span>
            </p>
            <Link href={`/repertorio/${culto.id}`}
              className="text-sm px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors">
              Ver repertorio
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-400">Nenhum repertorio cadastrado ainda.</p>
            <Link href={`/repertorio/${culto.id}`}
              className="text-sm px-4 py-2 border border-violet-200 text-violet-600 rounded-xl hover:bg-violet-50 transition-colors">
              Criar repertorio
            </Link>
          </div>
        )}
      </div>

      {/* Inscricao do membro */}
      {culto.status === "ABERTO" && culto.inscricoesAbertas && !isAdmin && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-800">Minha participacao</h2>
          {jaInscrito ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-600 font-medium">Inscrito</span>
                <span className="text-xs text-zinc-400">
                  como {minhaInscricao?.instrumento}
                  {minhaInscricao?.fazBacking && " + Backing"}
                  {minhaInscricao?.comoInstrumentista && " (instrumentista)"}
                </span>
              </div>
              <button onClick={handleCancelar} disabled={cancelando}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
                {cancelando ? "Cancelando..." : "Cancelar inscricao"}
              </button>
            </div>
          ) : mostrarForm ? (
            <div className="space-y-3">
              {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <select value={instrumento} onChange={(e) => setInstrumento(e.target.value)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Selecione o instrumento...</option>
                  {INSTRUMENTOS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input type="checkbox" checked={fazBacking} onChange={(e) => setFazBacking(e.target.checked)}
                    className="rounded border-zinc-300 text-violet-600" />
                  Backing vocal
                </label>
                {isCantor && (
                  <label className="flex items-center gap-2 text-sm text-amber-700 cursor-pointer bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                    <input type="checkbox" checked={comoInstrumentista} onChange={(e) => setComoInstrumentista(e.target.checked)}
                      className="rounded border-amber-300 text-amber-600" />
                    So como instrumentista
                  </label>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleInscrever} disabled={inscrevendo}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50">
                  {inscrevendo ? "Inscrevendo..." : "Confirmar inscricao"}
                </button>
                <button onClick={() => { setMostrarForm(false); setErro(null) }}
                  className="px-4 py-2 text-sm text-zinc-500">Cancelar</button>
              </div>
            </div>
          ) : podeInscrever ? (
            <button onClick={() => setMostrarForm(true)}
              className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700">
              Inscrever-me neste culto
            </button>
          ) : (
            <p className="text-sm text-zinc-400">Inscricoes encerradas.</p>
          )}
        </div>
      )}

      {/* Painel de inscricao pelo admin */}
      {isAdmin && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800">Gerenciar inscricoes</h2>
          </div>
          <PainelInscricaoAdmin
            membrosDisponiveis={membrosDisponiveis}
            inscricoes={inscricoes}
            onInscrever={handleInscreverAdmin}
          />
        </div>
      )}

      {/* Lista de inscritos */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-800">
          Inscritos <span className="font-normal text-zinc-400">({inscricoes.length})</span>
        </h2>
        {inscricoes.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Nenhum inscrito ainda.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(porInstrumento).map(([inst, lista]) => (
              <div key={inst}>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{inst}</p>
                <div className="space-y-2">
                  {lista.map((inscricao) => (
                    <InscritoCard
                      key={inscricao.id}
                      inscricao={inscricao}
                      isMe={inscricao.membroId === membroId}
                      isAdmin={isAdmin}
                      onAusenciaToggle={handleAusenciaToggle}
                      onCancelarAdmin={handleCancelarAdmin}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
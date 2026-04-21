// src/components/cultos/CultoForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CriarCultoDto } from "@/dtos/culto/criar-culto.dto"
import type { CultoResponseDto } from "@/dtos/culto/culto-response.dto"

interface CultoFormProps {
  culto?: CultoResponseDto
}

const TIPOS_CULTO = [
  { value: "CULTO_DOMINGO_MANHA", label: "Culto Domingo Manhã" },
  { value: "CULTO_DOMINGO_NOITE", label: "Culto Domingo Noite" },
  { value: "CULTO_SEMANA", label: "Culto de Semana" },
  { value: "ENSAIO", label: "Ensaio" },
  { value: "SEMANA_ORACAO", label: "Semana de Oração" },
  { value: "ESPECIAL", label: "Culto Especial" },
  { value: "OUTRO", label: "Outro" },
]

const STATUS_CULTO = [
  { value: "ABERTO", label: "Aberto", desc: "Inscrições disponíveis" },
  { value: "FECHADO", label: "Fechado", desc: "Inscrições encerradas" },
  { value: "REALIZADO", label: "Realizado", desc: "Culto já aconteceu" },
]

const INSTRUMENTOS_DISPONIVEIS = [
  "Violão", "Guitarra", "Baixo", "Bateria", "Teclado", "Piano",
  "Violino", "Percussão", "Flauta", "Voz",
]

interface LimiteForm { instrumento: string; limite: number }

export default function CultoForm({ culto }: CultoFormProps) {
  const router = useRouter()
  const isEdicao = Boolean(culto)

  const toLocalDatetime = (iso?: string | null) => {
    if (!iso) return ""
    return iso.slice(0, 16)
  }

  const [form, setForm] = useState({
    tipo: culto?.tipo ?? "CULTO_DOMINGO_MANHA",
    subtipo: culto?.subtipo ?? "",
    dataHoraInicio: toLocalDatetime(culto?.dataHoraInicio),
    dataHoraFim: toLocalDatetime(culto?.dataHoraFim),
    status: culto?.status ?? "ABERTO",
    inscricoesAbertas: culto?.inscricoesAbertas ?? true,
    prazoCancelamentoHoras: culto?.prazoCancelamentoHoras ?? 48,
    repetirSemanal: culto?.repetirSemanal ?? false,
    observacoesInternas: culto?.observacoesInternas ?? "",
  })

  const [limites, setLimites] = useState<LimiteForm[]>(
    culto?.limites.map((l) => ({ instrumento: l.instrumento, limite: l.limite })) ?? []
  )

  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErros((prev) => { const next = { ...prev }; delete next[campo]; return next })
  }

  function adicionarLimite() {
    const disponivel = INSTRUMENTOS_DISPONIVEIS.find(
      (i) => !limites.some((l) => l.instrumento === i)
    )
    if (disponivel) setLimites((prev) => [...prev, { instrumento: disponivel, limite: 1 }])
  }

  function atualizarLimite(idx: number, campo: keyof LimiteForm, valor: string | number) {
    setLimites((prev) => prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)))
  }

  function removerLimite(idx: number) {
    setLimites((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErroGeral(null)

    const payload: Partial<CriarCultoDto> & { status?: string } = {
      ...form,
      tipo: form.tipo as CriarCultoDto["tipo"],
      dataHoraInicio: new Date(form.dataHoraInicio).toISOString(),
      dataHoraFim: form.dataHoraFim ? new Date(form.dataHoraFim).toISOString() : undefined,
      subtipo: form.subtipo || undefined,
      observacoesInternas: form.observacoesInternas || undefined,
      limites,
    }

    try {
      const url = isEdicao ? `/api/cultos/${culto!.id}` : "/api/cultos"
      const method = isEdicao ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      router.push("/cultos")
      router.refresh()
    } catch {
      setErroGeral("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {erroGeral && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erroGeral}
        </div>
      )}

      {/* Informações principais */}
      <Secao titulo="Informações do culto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Tipo de culto" erro={erros.tipo} required>
            <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)} className={inputClass(erros.tipo)}>
              {TIPOS_CULTO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Subtipo / descrição curta" erro={erros.subtipo}>
            <input
              type="text"
              value={form.subtipo}
              onChange={(e) => set("subtipo", e.target.value)}
              placeholder="Ex: Louvor especial de páscoa"
              className={inputClass(erros.subtipo)}
            />
          </Campo>
          <Campo label="Data e hora de início" erro={erros.dataHoraInicio} required>
            <input
              type="datetime-local"
              value={form.dataHoraInicio}
              onChange={(e) => set("dataHoraInicio", e.target.value)}
              className={inputClass(erros.dataHoraInicio)}
            />
          </Campo>
          <Campo label="Data e hora de término" erro={erros.dataHoraFim}>
            <input
              type="datetime-local"
              value={form.dataHoraFim}
              onChange={(e) => set("dataHoraFim", e.target.value)}
              className={inputClass(erros.dataHoraFim)}
            />
          </Campo>
        </div>
        <Campo label="Observações internas" erro={erros.observacoesInternas}>
          <textarea
            value={form.observacoesInternas}
            onChange={(e) => set("observacoesInternas", e.target.value)}
            rows={2}
            placeholder="Visível apenas para a equipe..."
            className={inputClass(erros.observacoesInternas) + " resize-none"}
          />
        </Campo>
      </Secao>

      {/* Status — apenas na edição */}
      {isEdicao && (
        <Secao titulo="Status do culto">
          <div className="grid grid-cols-3 gap-2">
            {STATUS_CULTO.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set("status", s.value)}
                className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                  form.status === s.value
                    ? s.value === "ABERTO"
                      ? "border-emerald-400 bg-emerald-50"
                      : s.value === "FECHADO"
                      ? "border-amber-400 bg-amber-50"
                      : "border-zinc-400 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span className={`text-sm font-medium ${
                  form.status === s.value
                    ? s.value === "ABERTO"
                      ? "text-emerald-700"
                      : s.value === "FECHADO"
                      ? "text-amber-700"
                      : "text-zinc-600"
                    : "text-zinc-600"
                }`}>
                  {s.label}
                </span>
                <span className="text-xs text-zinc-400 mt-0.5">{s.desc}</span>
              </button>
            ))}
          </div>
          {form.status === "REALIZADO" && (
            <p className="text-xs text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2">
              💡 Marcar como Realizado move este culto para o histórico de repertórios dos membros escalados.
            </p>
          )}
        </Secao>
      )}

      {/* Configurações de inscrição */}
      <Secao titulo="Inscrições">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Prazo de cancelamento (horas)" erro={erros.prazoCancelamentoHoras}>
            <input
              type="number"
              min={0}
              value={form.prazoCancelamentoHoras}
              onChange={(e) => set("prazoCancelamentoHoras", Number(e.target.value))}
              className={inputClass(erros.prazoCancelamentoHoras)}
            />
          </Campo>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.inscricoesAbertas}
              onChange={(e) => set("inscricoesAbertas", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm text-zinc-700">Inscrições abertas</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.repetirSemanal}
              onChange={(e) => set("repetirSemanal", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm text-zinc-700">Repetir semanalmente</span>
          </label>
        </div>
      </Secao>

      {/* Limites por instrumento */}
      <Secao titulo="Limites por instrumento (opcional)">
        {limites.length === 0 && (
          <p className="text-sm text-zinc-400">
            Sem limites definidos — qualquer número de músicos pode se inscrever.
          </p>
        )}
        <div className="space-y-2">
          {limites.map((l, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <select
                value={l.instrumento}
                onChange={(e) => atualizarLimite(idx, "instrumento", e.target.value)}
                className={inputClass() + " flex-1"}
              >
                {INSTRUMENTOS_DISPONIVEIS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={l.limite}
                onChange={(e) => atualizarLimite(idx, "limite", Number(e.target.value))}
                className={inputClass() + " w-20 text-center"}
              />
              <span className="text-xs text-zinc-400 shrink-0">vaga{l.limite !== 1 ? "s" : ""}</span>
              <button
                type="button"
                onClick={() => removerLimite(idx)}
                className="text-zinc-300 hover:text-red-500 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {limites.length < INSTRUMENTOS_DISPONIVEIS.length && (
          <button
            type="button"
            onClick={adicionarLimite}
            className="mt-2 text-sm text-violet-600 hover:text-violet-800 transition-colors"
          >
            + Adicionar limite
          </button>
        )}
      </Secao>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Salvando..." : isEdicao ? "Salvar alterações" : "Criar culto"}
        </button>
      </div>
    </form>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{titulo}</h3>
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">{children}</div>
    </div>
  )
}

function Campo({ label, erro, required, children }: { label: string; erro?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
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
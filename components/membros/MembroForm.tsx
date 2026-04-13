// src/components/membros/MembroForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CriarMembroDto } from "@/dtos/membro/criar-membro.dto"
import type { MembroResponseDto } from "@/dtos/membro/membro-response.dto"

interface MembroFormProps {
  membro?: MembroResponseDto
}

const PERFIS = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "CANTOR", label: "Cantor(a)" },
  { value: "MUSICO", label: "Músico" },
  { value: "BACKING_VOCAL", label: "Backing Vocal" },
]

const INSTRUMENTOS = [
  "Violão", "Guitarra", "Baixo", "Bateria", "Teclado",
  "Piano", "Violino", "Percussão", "Flauta", "Voz", "Outro",
]

interface SenhaCriada {
  nome: string
  email: string
  senhaTemporaria: string
  emailEnviado: boolean
}

export default function MembroForm({ membro }: MembroFormProps) {
  const router = useRouter()
  const isEdicao = Boolean(membro)

  const [form, setForm] = useState<Partial<CriarMembroDto>>({
    nome: membro?.nome ?? "",
    email: membro?.email ?? "",
    telefone: membro?.telefone ?? "",
    perfil: (membro?.perfil as CriarMembroDto["perfil"]) ?? "MUSICO",
    instrumentoPrincipal: membro?.instrumentoPrincipal ?? "",
    instrumentoSecundario: membro?.instrumentoSecundario ?? "",
    fazBackingVocal: membro?.fazBackingVocal ?? false,
  })

  const [erros, setErros] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [senhaCriada, setSenhaCriada] = useState<SenhaCriada | null>(null)
  const [copiado, setCopiado] = useState(false)

  function set<K extends keyof CriarMembroDto>(campo: K, valor: CriarMembroDto[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErros((prev) => { const next = { ...prev }; delete next[campo]; return next })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErroGeral(null)

    try {
      const url = isEdicao ? `/api/membros/${membro!.id}` : "/api/membros"
      const method = isEdicao ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.status === 422) {
        const novosErros: Record<string, string> = {}
        for (const [campo, msgs] of Object.entries(data.detalhes ?? {})) {
          novosErros[campo] = (msgs as string[])[0]
        }
        setErros(novosErros)
        return
      }

      if (!res.ok) {
        setErroGeral(data.error ?? "Erro ao salvar membro")
        return
      }

      if (!isEdicao && data.senhaTemporaria) {
        setSenhaCriada({
          nome: data.nome,
          email: data.email,
          senhaTemporaria: data.senhaTemporaria,
          emailEnviado: data.emailEnviado ?? false,
        })
        return
      }

      router.push("/membros")
      router.refresh()
    } catch {
      setErroGeral("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function copiarSenha() {
    if (!senhaCriada) return
    await navigator.clipboard.writeText(senhaCriada.senhaTemporaria)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Tela de confirmação com senha temporária
  if (senhaCriada) {
    return (
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">
              ✓
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Membro cadastrado com sucesso!</p>
              <p className="text-sm text-emerald-700">{senhaCriada.nome}</p>
            </div>
          </div>

          <p className="text-sm text-emerald-800 mb-4">
            Repasse as credenciais abaixo ao membro. A senha só aparece uma vez — após fechar esta tela não é possível recuperá-la.
          </p>

          <div className="bg-white border border-emerald-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">Email</p>
              <p className="text-sm font-mono text-zinc-800">{senhaCriada.email}</p>
            </div>
            <div className="border-t border-zinc-100 pt-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">Senha temporária</p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-mono font-bold text-zinc-900 tracking-widest">
                  {senhaCriada.senhaTemporaria}
                </p>
                <button
                  onClick={copiarSenha}
                  className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  {copiado ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          </div>

          {senhaCriada.emailEnviado ? (
            <p className="text-xs text-emerald-700 mt-3">
              ✉️ Um email com as credenciais foi enviado para {senhaCriada.email}.
            </p>
          ) : (
            <p className="text-xs text-amber-700 mt-3">
              ⚠️ Não foi possível enviar o email. Repasse as credenciais acima manualmente ao membro.
            </p>
          )}

          <p className="text-xs text-emerald-700 mt-1">
            🔑 O membro será solicitado a criar uma nova senha no primeiro acesso.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setSenhaCriada(null)
              setForm({
                nome: "", email: "", telefone: "",
                perfil: "MUSICO", instrumentoPrincipal: "",
                instrumentoSecundario: "", fazBackingVocal: false,
              })
            }}
            className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Cadastrar outro membro
          </button>
          <button
            onClick={() => { router.push("/membros"); router.refresh() }}
            className="px-6 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Ir para lista de membros
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {erroGeral && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erroGeral}
        </div>
      )}

      <Secao titulo="Dados pessoais">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome completo" erro={erros.nome} required>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Ex: Ana Carolina Silva"
              className={inputClass(erros.nome)}
            />
          </Campo>
          <Campo label="E-mail" erro={erros.email} required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="ana@exemplo.com"
              className={inputClass(erros.email)}
            />
          </Campo>
          <Campo label="Telefone / WhatsApp" erro={erros.telefone}>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(11) 99999-9999"
              className={inputClass(erros.telefone)}
            />
          </Campo>
          <Campo label="Perfil no ministério" erro={erros.perfil} required>
            <select
              value={form.perfil}
              onChange={(e) => set("perfil", e.target.value as CriarMembroDto["perfil"])}
              className={inputClass(erros.perfil)}
            >
              {PERFIS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Instrumentos e vocal">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Instrumento principal" erro={erros.instrumentoPrincipal}>
            <select
              value={form.instrumentoPrincipal}
              onChange={(e) => set("instrumentoPrincipal", e.target.value)}
              className={inputClass(erros.instrumentoPrincipal)}
            >
              <option value="">Selecionar...</option>
              {INSTRUMENTOS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Instrumento secundário" erro={erros.instrumentoSecundario}>
            <select
              value={form.instrumentoSecundario}
              onChange={(e) => set("instrumentoSecundario", e.target.value)}
              className={inputClass(erros.instrumentoSecundario)}
            >
              <option value="">Nenhum</option>
              {INSTRUMENTOS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </Campo>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none mt-2">
          <input
            type="checkbox"
            checked={form.fazBackingVocal}
            onChange={(e) => set("fazBackingVocal", e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-sm text-zinc-700">Este membro faz backing vocal</span>
        </label>
      </Secao>

      {!isEdicao && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Uma senha temporária será gerada e enviada por email ao membro. Ela também será exibida aqui após o cadastro.
        </div>
      )}

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
          className="px-6 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Salvando..." : isEdicao ? "Salvar alterações" : "Cadastrar membro"}
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

function Campo({ label, erro, required, children }: {
  label: string; erro?: string; required?: boolean; children: React.ReactNode
}) {
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
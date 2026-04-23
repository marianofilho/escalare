"use client"
// src/components/perfil/PerfilForm.tsx

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createSupabaseClient } from "@/lib/supabase"
import type { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import type { AtualizarPerfilDto } from "@/dtos/membro/atualizar-perfil.dto"

const INSTRUMENTOS = [
  "Violao", "Guitarra", "Baixo", "Bateria", "Teclado",
  "Piano", "Violino", "Percussao", "Flauta", "Voz", "Outro",
]

const PERFIL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  CANTOR: "Cantor(a)",
  MUSICO: "Musico",
  BACKING_VOCAL: "Backing Vocal",
}

// ── redimensiona para 256x256 webp via canvas ──────────────────────────────

async function redimensionarImagem(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const SIZE = 256
      const canvas = document.createElement("canvas")
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("Canvas nao disponivel")); return }

      const ratio = Math.max(SIZE / img.width, SIZE / img.height)
      const w = img.width * ratio
      const h = img.height * ratio
      const x = (SIZE - w) / 2
      const y = (SIZE - h) / 2

      ctx.drawImage(img, x, y, w, h)
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error("Falha ao converter")) },
        "image/webp",
        0.85
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Imagem invalida")) }
    img.src = url
  })
}

// ── helpers de UI ──────────────────────────────────────────────────────────

function inputClass(erro?: string) {
  return [
    "w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 bg-white",
    "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent",
    "placeholder:text-zinc-400 transition-colors",
    erro ? "border-red-400" : "border-zinc-200 hover:border-zinc-300",
  ].join(" ")
}

function Campo({ label, erro, children }: {
  label: string; erro?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      {children}
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
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

// ── componente principal ───────────────────────────────────────────────────

interface PerfilFormProps {
  membro: MembroResponseDto
  igrejaId: string
}

export default function PerfilForm({ membro, igrejaId }: PerfilFormProps) {
  const router = useRouter()
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<AtualizarPerfilDto>({
    nome: membro.nome,
    telefone: membro.telefone ?? "",
    instrumentoPrincipal: membro.instrumentoPrincipal ?? "",
    instrumentoSecundario: membro.instrumentoSecundario ?? "",
    fazBackingVocal: membro.fazBackingVocal,
    fotoPerfil: membro.fotoPerfil ?? "",
  })

  const [preview, setPreview] = useState<string | null>(membro.fotoPerfil ?? null)
  const [uploadando, setUploadando] = useState(false)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  function set<K extends keyof AtualizarPerfilDto>(campo: K, valor: AtualizarPerfilDto[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErros((prev) => { const next = { ...prev }; delete next[campo]; return next })
    setSucesso(false)
  }

  // ── upload da foto ──
  async function handleFotoSelecionada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErroFoto("Selecione uma imagem valida (JPG, PNG, etc).")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErroFoto("A imagem deve ter no maximo 5 MB.")
      return
    }

    setErroFoto(null)
    setUploadando(true)

    try {
      const blob = await redimensionarImagem(file)
      setPreview(URL.createObjectURL(blob))

      const supabase = createSupabaseClient()
      const path = `${igrejaId}/${membro.id}.webp`

      const { error: uploadError } = await supabase.storage
        .from("avatares")
        .upload(path, blob, { contentType: "image/webp", upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data } = supabase.storage.from("avatares").getPublicUrl(path)
      const urlPublica = `${data.publicUrl}?t=${Date.now()}`
      set("fotoPerfil", urlPublica)
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : "Erro ao fazer upload da foto.")
      setPreview(membro.fotoPerfil ?? null)
    } finally {
      setUploadando(false)
      if (inputFotoRef.current) inputFotoRef.current.value = ""
    }
  }

  // ── submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErroGeral(null)
    setSucesso(false)

    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
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
        setErroGeral(data.error ?? "Erro ao salvar perfil")
        return
      }

      setSucesso(true)

      const supabase = createSupabaseClient()
      await supabase.auth.refreshSession()

      router.refresh()
    } catch {
      setErroGeral("Erro de conexao. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const iniciais = membro.nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {erroGeral && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erroGeral}
        </div>
      )}
      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          Perfil atualizado com sucesso!
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-700 overflow-hidden ring-2 ring-violet-200">
            {preview ? (
              <Image src={preview} alt={membro.nome} width={80} height={80} className="object-cover" />
            ) : (
              iniciais
            )}
          </div>
          {uploadando && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-base font-semibold text-zinc-900">{membro.nome}</p>
          <p className="text-sm text-zinc-400">{PERFIL_LABEL[membro.perfil] ?? membro.perfil}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={uploadando}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              {uploadando ? "Enviando..." : "Alterar foto"}
            </button>
            {preview && (
              <button
                type="button"
                onClick={() => { setPreview(null); set("fotoPerfil", "") }}
                disabled={uploadando}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                Remover
              </button>
            )}
          </div>
          {erroFoto && <p className="text-xs text-red-600">{erroFoto}</p>}
          <p className="text-xs text-zinc-400">JPG, PNG ou WEBP · max 5 MB · 256x256</p>
        </div>

        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          onChange={handleFotoSelecionada}
          className="hidden"
        />
      </div>

      <Secao titulo="Dados pessoais">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome completo" erro={erros.nome}>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Ex: Ana Carolina Silva"
              className={inputClass(erros.nome)}
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="E-mail">
            <input
              type="email"
              value={membro.email}
              disabled
              className="w-full rounded-lg border border-zinc-100 px-3 py-2 text-sm text-zinc-400 bg-zinc-50 cursor-not-allowed"
            />
          </Campo>
          <Campo label="Perfil no ministerio">
            <input
              type="text"
              value={PERFIL_LABEL[membro.perfil] ?? membro.perfil}
              disabled
              className="w-full rounded-lg border border-zinc-100 px-3 py-2 text-sm text-zinc-400 bg-zinc-50 cursor-not-allowed"
            />
          </Campo>
        </div>
        <p className="text-xs text-zinc-400">
          E-mail e perfil so podem ser alterados por um administrador.
        </p>
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
              {INSTRUMENTOS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Campo>
          <Campo label="Instrumento secundario" erro={erros.instrumentoSecundario}>
            <select
              value={form.instrumentoSecundario}
              onChange={(e) => set("instrumentoSecundario", e.target.value)}
              className={inputClass(erros.instrumentoSecundario)}
            >
              <option value="">Nenhum</option>
              {INSTRUMENTOS.map((i) => <option key={i} value={i}>{i}</option>)}
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
          <span className="text-sm text-zinc-700">Faco backing vocal</span>
        </label>
      </Secao>

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
          disabled={loading || uploadando}
          className="px-6 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Salvando..." : "Salvar alteracoes"}
        </button>
      </div>
    </form>
  )
}
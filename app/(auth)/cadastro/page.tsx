"use client"

import { useState, type FormEvent, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface FormState {
  igrejaSlug: string
  igrejaNome: string
  nome: string
  email: string
  senha: string
  confirmacaoSenha: string
}

interface ApiError {
  error: string
  detalhes?: Record<string, string[]>
}

const INITIAL_STATE: FormState = {
  igrejaSlug: "",
  igrejaNome: "",
  nome: "",
  email: "",
  senha: "",
  confirmacaoSenha: "",
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      // Auto-preenche slug ao digitar o nome da igreja
      if (name === "igrejaNome") {
        next.igrejaSlug = slugify(value)
      }
      return next
    })
    // Limpa erro do campo ao editar
    setFieldErrors((prev) => ({ ...prev, [name]: [] }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const response = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data: unknown = await response.json()

      if (!response.ok) {
        const apiError = data as ApiError
        if (apiError.detalhes) {
          setFieldErrors(apiError.detalhes)
        } else {
          setError(apiError.error)
        }
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function fieldError(field: string): string | undefined {
    return fieldErrors[field]?.[0]
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Cadastrar ministério</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie a conta do seu ministério de louvor
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção — Igreja */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Dados da Igreja
            </legend>

            <Field
              label="Nome da Igreja"
              id="igrejaNome"
              name="igrejaNome"
              type="text"
              placeholder="Igreja Batista Central"
              value={form.igrejaNome}
              onChange={handleChange}
              error={fieldError("igrejaNome")}
              disabled={loading}
              required
            />

            <Field
              label="Identificador (slug)"
              id="igrejaSlug"
              name="igrejaSlug"
              type="text"
              placeholder="igreja-batista-central"
              value={form.igrejaSlug}
              onChange={handleChange}
              error={fieldError("igrejaSlug")}
              disabled={loading}
              hint="Apenas letras minúsculas, números e hífens. Usado na URL."
              required
            />
          </fieldset>

          <hr className="border-slate-100" />

          {/* Seção — Administrador */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Conta do Administrador
            </legend>

            <Field
              label="Seu nome"
              id="nome"
              name="nome"
              type="text"
              placeholder="João Silva"
              value={form.nome}
              onChange={handleChange}
              error={fieldError("nome")}
              disabled={loading}
              required
            />

            <Field
              label="Email"
              id="email"
              name="email"
              type="email"
              placeholder="joao@email.com"
              value={form.email}
              onChange={handleChange}
              error={fieldError("email")}
              disabled={loading}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Senha"
                id="senha"
                name="senha"
                type="password"
                placeholder="••••••••"
                value={form.senha}
                onChange={handleChange}
                error={fieldError("senha")}
                disabled={loading}
                required
              />
              <Field
                label="Confirmar senha"
                id="confirmacaoSenha"
                name="confirmacaoSenha"
                type="password"
                placeholder="••••••••"
                value={form.confirmacaoSenha}
                onChange={handleChange}
                error={fieldError("confirmacaoSenha")}
                disabled={loading}
                required
              />
            </div>
          </fieldset>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium
                       py-2 px-4 rounded-lg text-sm transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando conta…" : "Criar ministério"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Já tem conta?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}

// Componente Field reutilizável local
interface FieldProps {
  label: string
  id: string
  name: string
  type: string
  placeholder: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
}

function Field({
  label, id, name, type, placeholder,
  value, onChange, error, hint, disabled, required,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full rounded-lg border px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          disabled:opacity-50
          ${error ? "border-red-400 bg-red-50" : "border-slate-300"}`}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
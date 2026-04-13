// src/app/auth/callback/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"

export default function CallbackPage() {
  const router = useRouter()
  const [senha, setSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      router.replace("/auth/erro?error=link_invalido")
      return
    }

    const params = new URLSearchParams(hash.replace("#", ""))
    const error = params.get("error")
    const errorCode = params.get("error_code")
    const errorDescription = params.get("error_description")
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    const type = params.get("type")

    if (error || errorCode) {
      const query = new URLSearchParams({
        error: error ?? "erro_desconhecido",
        error_code: errorCode ?? "",
        error_description: errorDescription ?? "",
      })
      router.replace(`/auth/erro?${query}`)
      return
    }

    if (accessToken && refreshToken && type === "recovery") {
      // Estabelece a sessão com os tokens recebidos
      const supabase = createSupabaseClient()
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          router.replace("/auth/erro?error=session_failed&error_description=" + error.message)
        } else {
          setPronto(true)
        }
      })
      return
    }

    router.replace("/auth/erro?error=link_invalido")
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmacao) {
      setErro("As senhas não coincidem")
      return
    }
    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres")
      return
    }

    setLoading(true)
    setErro(null)

    const supabase = createSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  if (!pronto) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">Validando acesso...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Definir senha</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Crie uma senha para acessar o ministério
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Nova senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Confirmar senha
            </label>
            <input
              type="password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Definir senha e entrar"}
          </button>
        </form>
      </div>
    </main>
  )
}
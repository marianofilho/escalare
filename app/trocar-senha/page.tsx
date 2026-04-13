// src/app/trocar-senha/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"

export default function TrocarSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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

    // Atualiza a senha
    const { error: senhaError } = await supabase.auth.updateUser({
      password: senha,
    })

    if (senhaError) {
      setErro(senhaError.message)
      setLoading(false)
      return
    }

    // Remove flag de troca obrigatória do user_metadata
    await supabase.auth.updateUser({
      data: { precisaTrocarSenha: false },
    })

    // Força refresh da sessão para os cookies refletirem o novo user_metadata
    await supabase.auth.refreshSession()

    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 text-xl">🔑</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 text-center">Crie sua senha</h1>
          <p className="text-sm text-zinc-500 mt-2 text-center">
            Por segurança, defina uma senha pessoal para acessar o ministério.
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
              placeholder="Mínimo 6 caracteres"
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
              placeholder="Repita a senha"
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
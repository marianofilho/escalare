// src/hooks/useAuth.ts
"use client"

import { useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface LoginPayload {
  email: string
  senha: string
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function login({ email, senha }: LoginPayload): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      const supabase = createSupabaseClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

      if (authError) {
        setError("E-mail ou senha inválidos")
        return
      }

      // Verifica se precisa trocar senha antes de navegar
      // O middleware também faz essa verificação, mas fazer aqui
      // garante o redirecionamento imediato sem depender do proxy
      const precisaTrocar = data.user?.user_metadata?.precisaTrocarSenha
      if (precisaTrocar) {
        router.push("/trocar-senha")
        router.refresh()
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function logout(): Promise<void> {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return { login, logout, loading, error }
}
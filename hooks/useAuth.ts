"use client"

import { useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { UsuarioResponseDto } from "@/dtos/auth/usuario-response.dto"

interface LoginPayload {
  email: string
  senha: string
}

interface AuthState {
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ loading: false, error: null })
  const router = useRouter()

  async function login({ email, senha }: LoginPayload): Promise<void> {
    setState({ loading: true, error: null })
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })

      const data: unknown = await response.json()

      if (!response.ok) {
        const errorData = data as { error: string }
        setState({ loading: false, error: errorData.error })
        return
      }

      setState({ loading: false, error: null })
      router.push("/dashboard")
      router.refresh()
    } catch {
      setState({ loading: false, error: "Erro de conexão. Tente novamente." })
    }
  }

  async function logout(): Promise<void> {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return { login, logout, ...state }
}
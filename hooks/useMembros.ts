// src/hooks/useMembros.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import type { MembroResponseDto } from "@/dtos/membro/membro-response.dto"

interface UseMembrosOptions {
  status?: "ATIVO" | "INATIVO"
  perfil?: string
}

export function useMembros(opcoes: UseMembrosOptions = {}) {
  const [membros, setMembros] = useState<MembroResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (opcoes.status) params.set("status", opcoes.status)
      if (opcoes.perfil) params.set("perfil", opcoes.perfil)

      const res = await fetch(`/api/membros?${params.toString()}`)
      if (!res.ok){
        throw new Error("Erro ao carregar membros")
      } 

      const json = await res.json()
      const data: MembroResponseDto[] = Array.isArray(json) ? json : (json.data ?? [])
      setMembros(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [opcoes.status, opcoes.perfil])

  useEffect(() => { buscar() }, [buscar])

  return { membros, loading, error, recarregar: buscar }
}
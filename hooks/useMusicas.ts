// src/hooks/useMusicas.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import type { MusicaResponseDto } from "@/dtos/musica/musica-response.dto"

interface UseMusicasOptions {
  status?: string
  busca?: string
}

export function useMusicas(opcoes: UseMusicasOptions = {}) {
  const [musicas, setMusicas] = useState<MusicaResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (opcoes.status) params.set("status", opcoes.status)
      if (opcoes.busca) params.set("busca", opcoes.busca)

      const res = await fetch(`/api/musicas?${params.toString()}`)
      if (!res.ok) throw new Error("Erro ao carregar músicas")
      const data: MusicaResponseDto[] = await res.json()
      setMusicas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [opcoes.status, opcoes.busca])

  useEffect(() => {
    buscar()
  }, [buscar])

  return { musicas, loading, error, recarregar: buscar }
}
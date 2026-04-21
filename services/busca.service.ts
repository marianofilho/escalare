// src/services/busca.service.ts
import type { BuscaRepository, ResultadoBusca } from "@/repositories/busca.repository"

const TERMO_MINIMO = 2

export class BuscaService {
  constructor(private readonly buscaRepository: BuscaRepository) {}

  async buscar(igrejaId: string, q: string): Promise<ResultadoBusca> {
    const termo = q.trim()

    if (termo.length < TERMO_MINIMO) {
      return { membros: [], musicas: [], cultos: [] }
    }

    return this.buscaRepository.buscar(igrejaId, termo)
  }

  temResultados(resultado: ResultadoBusca): boolean {
    return (
      resultado.membros.length > 0 ||
      resultado.musicas.length > 0 ||
      resultado.cultos.length > 0
    )
  }
}
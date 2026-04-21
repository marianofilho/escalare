// src/dtos/paginacao.dto.ts

export interface PaginacaoDto<T> {
  data: T[]
  total: number
  pagina: number
  totalPaginas: number
  temProxima: boolean
  temAnterior: boolean
}

export interface PaginacaoParams {
  pagina?: number
  porPagina?: number
}

export const ITENS_POR_PAGINA = 20

export function calcularSkip(pagina: number, porPagina: number): number {
  return (pagina - 1) * porPagina
}

export function calcularTotalPaginas(total: number, porPagina: number): number {
  return Math.ceil(total / porPagina)
}

export function montarPaginacao<T>(
  data: T[],
  total: number,
  pagina: number,
  porPagina: number
): PaginacaoDto<T> {
  const totalPaginas = calcularTotalPaginas(total, porPagina)
  return {
    data,
    total,
    pagina,
    totalPaginas,
    temProxima: pagina < totalPaginas,
    temAnterior: pagina > 1,
  }
}
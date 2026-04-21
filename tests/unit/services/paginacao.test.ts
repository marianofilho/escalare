// tests/unit/services/paginacao.test.ts
import { describe, it, expect } from "vitest"
import {
  calcularSkip,
  calcularTotalPaginas,
  montarPaginacao,
  ITENS_POR_PAGINA,
} from "@/dtos/paginacao.dto"

describe("Paginacao utilitarios", () => {
  describe("ITENS_POR_PAGINA", () => {
    it("e 20", () => {
      expect(ITENS_POR_PAGINA).toBe(20)
    })
  })

  describe("calcularSkip", () => {
    it("retorna 0 para pagina 1", () => {
      expect(calcularSkip(1, 20)).toBe(0)
    })

    it("retorna 20 para pagina 2 com 20 por pagina", () => {
      expect(calcularSkip(2, 20)).toBe(20)
    })

    it("retorna 40 para pagina 3 com 20 por pagina", () => {
      expect(calcularSkip(3, 20)).toBe(40)
    })

    it("funciona com porPagina diferente", () => {
      expect(calcularSkip(3, 10)).toBe(20)
    })
  })

  describe("calcularTotalPaginas", () => {
    it("retorna 1 quando total menor que porPagina", () => {
      expect(calcularTotalPaginas(15, 20)).toBe(1)
    })

    it("retorna 1 quando total igual a porPagina", () => {
      expect(calcularTotalPaginas(20, 20)).toBe(1)
    })

    it("retorna 2 quando total e 21", () => {
      expect(calcularTotalPaginas(21, 20)).toBe(2)
    })

    it("arredonda para cima corretamente", () => {
      expect(calcularTotalPaginas(41, 20)).toBe(3)
    })

    it("retorna 0 quando total e 0", () => {
      expect(calcularTotalPaginas(0, 20)).toBe(0)
    })
  })

  describe("montarPaginacao", () => {
    const itens = Array.from({ length: 20 }, (_, i) => ({ id: i }))

    it("monta estrutura correta para pagina 1 de 3", () => {
      const resultado = montarPaginacao(itens, 50, 1, 20)

      expect(resultado.data).toEqual(itens)
      expect(resultado.total).toBe(50)
      expect(resultado.pagina).toBe(1)
      expect(resultado.totalPaginas).toBe(3)
      expect(resultado.temProxima).toBe(true)
      expect(resultado.temAnterior).toBe(false)
    })

    it("monta estrutura correta para pagina 2 de 3", () => {
      const resultado = montarPaginacao(itens, 50, 2, 20)

      expect(resultado.temProxima).toBe(true)
      expect(resultado.temAnterior).toBe(true)
    })

    it("monta estrutura correta para ultima pagina", () => {
      const resultado = montarPaginacao(itens, 50, 3, 20)

      expect(resultado.temProxima).toBe(false)
      expect(resultado.temAnterior).toBe(true)
    })

    it("retorna temProxima false quando total menor que porPagina", () => {
      const resultado = montarPaginacao([{ id: 1 }], 5, 1, 20)

      expect(resultado.totalPaginas).toBe(1)
      expect(resultado.temProxima).toBe(false)
      expect(resultado.temAnterior).toBe(false)
    })

    it("preserva os dados recebidos", () => {
      const dados = [{ id: "abc", nome: "teste" }]
      const resultado = montarPaginacao(dados, 1, 1, 20)

      expect(resultado.data).toEqual(dados)
    })
  })
})
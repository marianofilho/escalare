// src/types/culto-errors.ts
export { NaoEncontradoError, AcessoNegadoError } from "@/types/errors"

export class CultoFechadoError extends Error {
  constructor() {
    super("Este culto não está aceitando inscrições")
    this.name = "CultoFechadoError"
  }
}

export class InstrumentoLotadoError extends Error {
  constructor(instrumento: string) {
    super(`Não há vagas disponíveis para "${instrumento}" neste culto`)
    this.name = "InstrumentoLotadoError"
  }
}

export class MembroJaInscritoError extends Error {
  constructor() {
    super("Este membro já está inscrito neste culto")
    this.name = "MembroJaInscritoError"
  }
}

export class PrazoCancelamentoError extends Error {
  constructor(horas: number) {
    super(`O prazo de cancelamento de ${horas}h já passou`)
    this.name = "PrazoCancelamentoError"
  }
}
// src/types/musica-errors.ts
export { NaoEncontradoError, AcessoNegadoError } from "@/types/errors"

export class MusicaJaExisteError extends Error {
  constructor(titulo: string) {
    super(`Já existe uma música com o título "${titulo}" neste ministério`)
    this.name = "MusicaJaExisteError"
  }
}

export class CantorJaVinculadoError extends Error {
  constructor() {
    super("Este cantor já está vinculado a esta música")
    this.name = "CantorJaVinculadoError"
  }
}

export class CantorNaoVinculadoError extends Error {
  constructor() {
    super("Este cantor não está vinculado a esta música")
    this.name = "CantorNaoVinculadoError"
  }
}

export class PerfilInvalidoParaCantorError extends Error {
  constructor() {
    super("Apenas membros com perfil CANTOR podem ser vinculados como cantores de uma música")
    this.name = "PerfilInvalidoParaCantorError"
  }
}
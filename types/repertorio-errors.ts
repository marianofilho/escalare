// src/types/repertorio-errors.ts
export { NaoEncontradoError, AcessoNegadoError } from "@/types/errors"

export class RepertorioJaExisteError extends Error {
  constructor() {
    super("Este culto já possui um repertório")
    this.name = "RepertorioJaExisteError"
  }
}

export class MusicaJaNoRepertorioError extends Error {
  constructor() {
    super("Esta música já está no repertório")
    this.name = "MusicaJaNoRepertorioError"
  }
}

export class CultoSemCantorError extends Error {
  constructor() {
    super("Este culto não tem cantor escalado — não é possível criar um repertório")
    this.name = "CultoSemCantorError"
  }
}

export class SemPermissaoRepertorioError extends Error {
  constructor() {
    super("Apenas o cantor escalado ou um administrador pode editar este repertório")
    this.name = "SemPermissaoRepertorioError"
  }
}

export class MusicaSemTomError extends Error {
  constructor(titulo: string) {
    super(`A música "${titulo}" não tem tom cadastrado para este cantor`)
    this.name = "MusicaSemTomError"
  }
}
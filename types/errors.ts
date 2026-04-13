// src/types/errors.ts
export class MembroJaExisteError extends Error {
  constructor(email: string) {
    super(`Já existe um membro com o e-mail ${email} nesta igreja`)
    this.name = "MembroJaExisteError"
  }
}

export class NaoEncontradoError extends Error {
  constructor(entidade: string, id: string) {
    super(`${entidade} com id "${id}" não encontrado`)
    this.name = "NaoEncontradoError"
  }
}

export class AcessoNegadoError extends Error {
  constructor() {
    super("Acesso negado")
    this.name = "AcessoNegadoError"
  }
}

export class CredenciaisInvalidasError extends Error {
  constructor() {
    super("E-mail ou senha inválidos")
    this.name = "CredenciaisInvalidasError"
  }
}

export class NaoAutorizadoError extends Error {
  constructor() {
    super("Não autorizado")
    this.name = "NaoAutorizadoError"
  }
}

export class UsuarioNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Usuário com id "${id}" não encontrado`)
    this.name = "UsuarioNaoEncontradoError"
  }
}
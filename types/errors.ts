export class NaoAutorizadoError extends Error {
  constructor() {
    super("Não autorizado")
    this.name = "NaoAutorizadoError"
  }
}

export class CredenciaisInvalidasError extends Error {
  constructor() {
    super("Email ou senha inválidos")
    this.name = "CredenciaisInvalidasError"
  }
}

export class UsuarioNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Usuário com id ${id} não encontrado`)
    this.name = "UsuarioNaoEncontradoError"
  }
}

export class NaoEncontradoError extends Error {
  constructor(entidade: string, id: string) {
    super(`${entidade} com id ${id} não encontrado`)
    this.name = "NaoEncontradoError"
  }
}

export class MembroJaExisteError extends Error {
  constructor(email: string) {
    super(`Membro com e-mail ${email} já existe nesta igreja`)
    this.name = "MembroJaExisteError"
  }
}
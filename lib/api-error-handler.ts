// src/lib/api-error-handler.ts
import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { MembroJaExisteError, NaoEncontradoError, AcessoNegadoError } from "@/types/errors"
import {
  CultoFechadoError,
  InstrumentoLotadoError,
  MembroJaInscritoError,
  PrazoCancelamentoError,
} from "@/types/culto-errors"

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: error.flatten().fieldErrors },
      { status: 422 }
    )
  }
  if (error instanceof MembroJaExisteError || error instanceof MembroJaInscritoError) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }
  if (error instanceof NaoEncontradoError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  if (error instanceof AcessoNegadoError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  if (
    error instanceof CultoFechadoError ||
    error instanceof InstrumentoLotadoError ||
    error instanceof PrazoCancelamentoError
  ) {
    return NextResponse.json({ error: error.message }, { status: 422 })
  }

  console.error("[API Error]", error)
  return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
}
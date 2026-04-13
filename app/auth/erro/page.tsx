// src/app/auth/erro/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

const MENSAGENS: Record<string, { titulo: string; descricao: string }> = {
  otp_expired: {
    titulo: "Link expirado",
    descricao:
      "O link de acesso expirou. Links de redefinição de senha são válidos por 24 horas. Solicite um novo link ao administrador do ministério.",
  },
  access_denied: {
    titulo: "Acesso negado",
    descricao:
      "Não foi possível validar o link de acesso. Ele pode ter sido usado anteriormente ou estar inválido.",
  },
  exchange_failed: {
    titulo: "Erro ao validar acesso",
    descricao: "Ocorreu um erro ao processar seu link. Tente novamente ou solicite um novo link.",
  },
  link_invalido: {
    titulo: "Link inválido",
    descricao: "O link de acesso é inválido. Solicite um novo link ao administrador do ministério.",
  },
}

function ErroConteudo() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get("error_code") ?? searchParams.get("error") ?? "link_invalido"
  const errorDescription = searchParams.get("error_description")

  const mensagem = MENSAGENS[errorCode] ?? {
    titulo: "Erro de acesso",
    descricao: errorDescription
      ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
      : "Ocorreu um erro inesperado. Tente novamente.",
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-xl">✕</span>
        </div>

        <h1 className="text-xl font-semibold text-zinc-900 mb-2">
          {mensagem.titulo}
        </h1>

        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
          {mensagem.descricao}
        </p>

        <Link
          href="/login"
          className="block w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          Ir para o login
        </Link>
      </div>
    </main>
  )
}

export default function AuthErroPage() {
  return (
    <Suspense>
      <ErroConteudo />
    </Suspense>
  )
}
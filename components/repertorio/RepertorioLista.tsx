// src/components/repertorio/RepertorioLista.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import type { CultoComRepertorioDto } from "@/dtos/repertorio/repertorio-response.dto"

interface Props {
  cultos: CultoComRepertorioDto[]
  historico: CultoComRepertorioDto[]
}

function CultoCard({ c, somenteLeitura }: { c: CultoComRepertorioDto; somenteLeitura?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-4 transition-all ${
      somenteLeitura
        ? "border-zinc-100 hover:border-zinc-200"
        : "border-zinc-200 hover:border-violet-300 hover:shadow-sm"
    }`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold ${somenteLeitura ? "text-zinc-500" : "text-zinc-800"}`}>
            {c.cultoTipo}
          </p>
          {c.instrumento && (
            <span className="text-xs bg-sky-50 border border-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
              {c.instrumento}
            </span>
          )}
          {c.temRepertorio ? (
            <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {c.totalMusicas} musica{c.totalMusicas !== 1 ? "s" : ""}
            </span>
          ) : (
            !somenteLeitura && (
              <span className="text-xs bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                Sem repertorio
              </span>
            )
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-1">{c.cultoData}</p>
        {c.cantorNome && (
          <p className="text-xs text-zinc-400">Cantor: {c.cantorNome}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {c.temRepertorio && !somenteLeitura && (
          <Link
            href={`/repertorio/${c.cultoId}/estudar`}
            className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Estudar
          </Link>
        )}
        {c.temRepertorio && somenteLeitura && (
          <Link
            href={`/repertorio/${c.cultoId}/estudar`}
            className="text-xs px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Ver
          </Link>
        )}
        {!somenteLeitura && (
          <Link
            href={`/repertorio/${c.cultoId}`}
            className="text-xs px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            {c.temRepertorio ? "Editar" : "Montar"}
          </Link>
        )}
      </div>
    </div>
  )
}

export default function RepertorioLista({ cultos, historico }: Props) {
  const [historicoAberto, setHistoricoAberto] = useState(false)

  return (
    <div className="space-y-8">
      {/* Proximos cultos */}
      <section className="space-y-3">
        {cultos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-sm">Voce nao esta escalado em nenhum culto proximo.</p>
          </div>
        ) : (
          cultos.map((c) => <CultoCard key={c.cultoId} c={c} />)
        )}
      </section>

      {/* Historico */}
      {historico.length > 0 && (
        <section>
          <button
            onClick={() => setHistoricoAberto((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors mb-3"
          >
            <span className={`transition-transform ${historicoAberto ? "rotate-90" : ""}`}>
              ▶
            </span>
            Historico ({historico.length} culto{historico.length !== 1 ? "s" : ""} realizado{historico.length !== 1 ? "s" : ""})
          </button>

          {historicoAberto && (
            <div className="space-y-2">
              {historico.map((c) => (
                <CultoCard key={c.cultoId} c={c} somenteLeitura />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
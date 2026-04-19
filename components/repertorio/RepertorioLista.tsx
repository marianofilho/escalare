// src/components/repertorio/RepertorioLista.tsx
"use client"

import Link from "next/link"
import type { CultoComRepertorioDto } from "@/dtos/repertorio/repertorio-response.dto"

interface Props {
  cultos: CultoComRepertorioDto[]
}

export default function RepertorioLista({ cultos }: Props) {
  if (cultos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400 text-sm">Você não está escalado em nenhum culto próximo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cultos.map((c) => (
        <div
          key={c.cultoId}
          className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-violet-300 hover:shadow-sm transition-all"
        >
          {/* Info do culto */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-zinc-800">{c.cultoTipo}</p>
              {c.instrumento && (
                <span className="text-xs bg-sky-50 border border-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                  {c.instrumento}
                </span>
              )}
              {c.temRepertorio ? (
                <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {c.totalMusicas} música{c.totalMusicas !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-xs bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                  Sem repertório
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">{c.cultoData}</p>
            {c.cantorNome && (
              <p className="text-xs text-zinc-400">Cantor: {c.cantorNome}</p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 shrink-0">
            {c.temRepertorio && (
              <Link
                href={`/repertorio/${c.cultoId}/estudar`}
                className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Estudar
              </Link>
            )}
            <Link
              href={`/repertorio/${c.cultoId}`}
              className="text-xs px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              {c.temRepertorio ? "Editar" : "Montar"}
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
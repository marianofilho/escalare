"use client"
// src/components/repertorio/BotaoExportarPDF.tsx

import Link from "next/link"

interface Props {
  cultoId: string
  className?: string
}

export default function BotaoExportarPDF({ cultoId, className }: Props) {
  return (
    <Link
      href={`/repertorio/${cultoId}/imprimir`}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "flex items-center gap-2 px-4 py-2 border border-zinc-200 text-zinc-600 text-sm rounded-xl hover:border-violet-300 hover:text-violet-700 transition-colors"}
    >
      <span>📄</span>
      Exportar PDF
    </Link>
  )
}
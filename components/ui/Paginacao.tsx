// src/components/ui/Paginacao.tsx
"use client"

interface PaginacaoProps {
  pagina: number
  totalPaginas: number
  total: number
  porPagina: number
  onChange: (pagina: number) => void
}

export default function Paginacao({
  pagina,
  totalPaginas,
  total,
  porPagina,
  onChange,
}: PaginacaoProps) {
  if (totalPaginas <= 1) return null

  const inicio = (pagina - 1) * porPagina + 1
  const fim = Math.min(pagina * porPagina, total)

  // Gera os números de página a exibir (com reticências)
  function gerarPaginas(): (number | "...")[] {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    }

    const paginas: (number | "...")[] = [1]

    if (pagina > 3) paginas.push("...")

    const inicio = Math.max(2, pagina - 1)
    const fim = Math.min(totalPaginas - 1, pagina + 1)
    for (let i = inicio; i <= fim; i++) paginas.push(i)

    if (pagina < totalPaginas - 2) paginas.push("...")

    paginas.push(totalPaginas)
    return paginas
  }

  const paginas = gerarPaginas()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-zinc-400">
        Exibindo {inicio}–{fim} de {total} resultado{total !== 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-1">
        {/* Anterior */}
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          ‹
        </button>

        {/* Números */}
        {paginas.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm text-zinc-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                p === pagina
                  ? "bg-violet-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Próxima */}
        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Próxima página"
        >
          ›
        </button>
      </div>
    </div>
  )
}
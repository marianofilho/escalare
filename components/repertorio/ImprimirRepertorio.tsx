"use client"
// src/components/repertorio/ImprimirRepertorio.tsx

import { useEffect } from "react"
import Link from "next/link"
import type { RepertorioResponseDto } from "@/dtos/repertorio/repertorio-response.dto"

interface Props {
  repertorio: RepertorioResponseDto
  tituloCulto: string
  dataCulto: string
  voltarHref: string
}

export default function ImprimirRepertorio({ repertorio, tituloCulto, dataCulto, voltarHref }: Props) {
  // Auto-abre o dialogo de impressao ao carregar a pagina
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Estilos de impressão via style tag inline */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page {
            margin: 1.5cm 2cm;
            size: A4 portrait;
          }
        }
        @media screen {
          .print-container {
            max-width: 700px;
            margin: 0 auto;
            padding: 32px 24px;
          }
        }
      `}</style>

      {/* Barra de ações — visível apenas na tela, oculta na impressão */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between gap-4">
        <Link href={voltarHref} className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
          ← Voltar
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 hidden sm:block">
            O dialogo de impressao deve abrir automaticamente.
          </span>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Conteúdo imprimível */}
      <div className="print-container">
        {/* Cabeçalho */}
        <div style={{ borderBottom: "2px solid #7c3aed", paddingBottom: "16px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#7c3aed", fontWeight: 600 }}>
                Ministerio de Louvor
              </p>
              <h1 style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 700, color: "#18181b" }}>
                {tituloCulto}
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#71717a" }}>
                {dataCulto}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#71717a" }}>Cantor(a)</p>
              <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "#18181b" }}>
                {repertorio.cantorNome}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#a1a1aa" }}>
                {repertorio.totalItens} musica{repertorio.totalItens !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de músicas */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e4e4e7" }}>
              <th style={{ textAlign: "left", padding: "8px 12px 8px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa", fontWeight: 600, width: "32px" }}>#</th>
              <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa", fontWeight: 600 }}>Musica</th>
              <th style={{ textAlign: "center", padding: "8px 12px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa", fontWeight: 600, width: "60px" }}>Tom</th>
              <th style={{ textAlign: "center", padding: "8px 12px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa", fontWeight: 600, width: "60px" }}>BPM</th>
              <th style={{ textAlign: "left", padding: "8px 0 8px 12px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa", fontWeight: 600 }}>Obs</th>
            </tr>
          </thead>
          <tbody>
            {repertorio.itens.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f4f4f5", pageBreakInside: "avoid" }}>
                <td style={{ padding: "10px 12px 10px 0", fontSize: "12px", color: "#a1a1aa", textAlign: "right" }}>
                  {item.ordem ?? idx + 1}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#18181b" }}>
                    {item.musicaTitulo}
                  </p>
                  {item.musicaArtista && (
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#71717a" }}>
                      {item.musicaArtista}
                    </p>
                  )}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "#ede9fe",
                    color: "#7c3aed",
                    fontSize: "13px",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}>
                    {item.tomUsado}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "12px", color: "#71717a" }}>
                  {item.musicaBpm ?? "—"}
                </td>
                <td style={{ padding: "10px 0 10px 12px", fontSize: "12px", color: "#71717a" }}>
                  {item.observacoes ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rodapé */}
        <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #e4e4e7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: "10px", color: "#a1a1aa" }}>
            Ministerio de Louvor — gerado automaticamente
          </p>
          <p style={{ margin: 0, fontSize: "10px", color: "#a1a1aa" }}>
            {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </>
  )
}
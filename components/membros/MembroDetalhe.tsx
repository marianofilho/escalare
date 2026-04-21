"use client"
// src/components/membros/MembroDetalhe.tsx

import Link from "next/link"
import type { MembroPerfilResponseDto } from "@/dtos/membro/membro-perfil-response.dto"

const PERFIL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  CANTOR: "Cantor(a)",
  MUSICO: "Musico",
  BACKING_VOCAL: "Backing Vocal",
}

const PERFIL_COR: Record<string, string> = {
  ADMINISTRADOR: "bg-red-100 text-red-700",
  CANTOR: "bg-violet-100 text-violet-700",
  MUSICO: "bg-sky-100 text-sky-700",
  BACKING_VOCAL: "bg-emerald-100 text-emerald-700",
}

const STATUS_COR: Record<string, string> = {
  ABERTO: "text-emerald-600",
  FECHADO: "text-amber-600",
  REALIZADO: "text-zinc-400",
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatarDataSimples(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

interface MembroDetalheProps {
  membro: MembroPerfilResponseDto
  isAdmin: boolean
  isMinhaConta: boolean
}

export default function MembroDetalhe({ membro, isAdmin, isMinhaConta }: MembroDetalheProps) {
  const iniciais = membro.nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/membros" className="hover:text-violet-600 transition-colors">Membros</Link>
        <span>/</span>
        <span className="text-zinc-600 font-medium truncate">{membro.nome}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-700 shrink-0 overflow-hidden ring-2 ring-violet-200">
            {membro.fotoPerfil ? (
              <img src={membro.fotoPerfil} alt={membro.nome} className="w-16 h-16 object-cover" />
            ) : (
              iniciais
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-900">{membro.nome}</h1>
              {membro.status === "INATIVO" && (
                <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">Inativo</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${PERFIL_COR[membro.perfil] ?? "bg-zinc-100 text-zinc-600"}`}>
                {PERFIL_LABEL[membro.perfil] ?? membro.perfil}
              </span>
              {membro.instrumentoPrincipal && (
                <span className="text-xs text-zinc-500">· {membro.instrumentoPrincipal}</span>
              )}
              {membro.instrumentoSecundario && (
                <span className="text-xs text-zinc-400">+ {membro.instrumentoSecundario}</span>
              )}
              {membro.fazBackingVocal && (
                <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">BV</span>
              )}
            </div>
            <p className="text-sm text-zinc-400">{membro.email}</p>
            {membro.telefone && (
              <p className="text-sm text-zinc-400">{membro.telefone}</p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 shrink-0">
            {isMinhaConta && (
              <Link
                href="/perfil"
                className="text-sm px-4 py-2 border border-zinc-200 rounded-xl text-zinc-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
              >
                Editar meu perfil
              </Link>
            )}
            {isAdmin && !isMinhaConta && (
              <Link
                href={`/membros/${membro.id}/editar`}
                className="text-sm px-4 py-2 border border-zinc-200 rounded-xl text-zinc-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
              >
                Editar
              </Link>
            )}
          </div>
        </div>

        {/* Métricas */}
        <div className="flex items-center gap-6 mt-5 pt-5 border-t border-zinc-100 flex-wrap">
          <div className="text-center">
            <p className="text-xl font-bold text-zinc-900">{membro.totalCultos}</p>
            <p className="text-xs text-zinc-400">cultos participados</p>
          </div>
          {membro.perfil === "CANTOR" && (
            <div className="text-center">
              <p className="text-xl font-bold text-zinc-900">{membro.musicasVinculadas.filter(m => m.statusMusica === "ATIVA").length}</p>
              <p className="text-xs text-zinc-400">musicas vinculadas</p>
            </div>
          )}
          {membro.dataIngresso && (
            <div>
              <p className="text-xs text-zinc-400">No ministerio desde</p>
              <p className="text-sm text-zinc-600">{formatarDataSimples(membro.dataIngresso)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Músicas vinculadas — apenas cantores */}
      {membro.perfil === "CANTOR" && membro.musicasVinculadas.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-800 mb-4">
            Musicas vinculadas
            <span className="ml-2 text-zinc-400 font-normal">({membro.musicasVinculadas.length})</span>
          </h2>
          <div className="space-y-2">
            {membro.musicasVinculadas.map((m) => (
              <div
                key={m.musicaId}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border ${
                  m.statusMusica === "ARQUIVADA"
                    ? "border-zinc-100 bg-zinc-50 opacity-60"
                    : "border-zinc-100 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{m.titulo}</p>
                  {m.artista && <p className="text-xs text-zinc-400 truncate">{m.artista}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs bg-violet-50 border border-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                    {m.tom}
                  </span>
                  {m.statusMusica === "ARQUIVADA" && (
                    <span className="text-xs text-zinc-400">arquivada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de cultos */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-4">
          Historico de cultos
          <span className="ml-2 text-zinc-400 font-normal">
            ({membro.totalCultos} no total)
          </span>
        </h2>

        {membro.cultosRecentes.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Nenhum culto registrado ainda.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {membro.cultosRecentes.map((c) => (
              <Link
                key={c.cultoId}
                href={`/cultos/${c.cultoId}`}
                className="flex items-center justify-between gap-3 py-3 hover:bg-zinc-50 -mx-2 px-2 rounded-lg transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 group-hover:text-violet-700 transition-colors truncate">
                    {c.tipo}{c.subtipo ? ` — ${c.subtipo}` : ""}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatarData(c.dataHoraInicio)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-500">{c.instrumento}</span>
                  {c.fazBacking && (
                    <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 rounded-full">BV</span>
                  )}
                  {c.ausente && (
                    <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-1.5 rounded-full">Ausente</span>
                  )}
                  <span className={`text-xs font-medium ${STATUS_COR[c.status] ?? "text-zinc-400"}`}>
                    {c.status === "REALIZADO" ? "Realizado" : c.status === "ABERTO" ? "Aberto" : "Fechado"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {membro.totalCultos > 20 && (
          <p className="text-xs text-zinc-400 text-center mt-3">
            Exibindo os 20 mais recentes de {membro.totalCultos} cultos.
          </p>
        )}
      </div>
    </main>
  )
}
"use client"
// src/components/dashboard/DashboardClient.tsx

import Link from "next/link"
import type { DashboardResponseDto, ProximoCultoDto } from "@/dtos/dashboard/dashboard-response.dto"

const TIPO_LABEL: Record<string, string> = {
  CULTO_DOMINGO_MANHA: "Domingo Manhã",
  CULTO_DOMINGO_NOITE: "Domingo Noite",
  CULTO_SEMANA: "Culto de Semana",
  ENSAIO: "Ensaio",
  SEMANA_ORACAO: "Semana de Oração",
  ESPECIAL: "Especial",
  OUTRO: "Outro",
}

const STATUS_COR: Record<string, string> = {
  ABERTO: "bg-emerald-100 text-emerald-700",
  FECHADO: "bg-zinc-100 text-zinc-500",
  REALIZADO: "bg-blue-100 text-blue-600",
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface MetricCardProps {
  label: string
  valor: number
  icone: string
  cor: string
  href: string
}

function MetricCard({ label, valor, icone, cor, href }: MetricCardProps) {
  return (
    <Link
      href={href}
      className="bg-white border border-zinc-200 rounded-2xl p-5 flex items-center gap-4 hover:border-violet-300 hover:shadow-sm transition-all group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${cor}`}>
        {icone}
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900 group-hover:text-violet-700 transition-colors">
          {valor}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
    </Link>
  )
}

function CultoCard({ culto }: { culto: ProximoCultoDto }) {
  const corStatus = STATUS_COR[culto.status] ?? "bg-zinc-100 text-zinc-500"
  const tipoLabel = TIPO_LABEL[culto.tipo] ?? culto.tipo
  const label = culto.subtipo ? `${tipoLabel} — ${culto.subtipo}` : tipoLabel

  return (
    <Link
      href={`/cultos/${culto.id}`}
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl hover:bg-zinc-50 transition-colors group border border-transparent hover:border-zinc-200"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800 truncate group-hover:text-violet-700 transition-colors">
          {label}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">{formatarData(culto.dataHoraInicio)}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-zinc-500">
          {culto.totalInscritos} inscrito{culto.totalInscritos !== 1 ? "s" : ""}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corStatus}`}>
          {culto.status === "ABERTO" ? "Aberto" : culto.status === "FECHADO" ? "Fechado" : "Realizado"}
        </span>
      </div>
    </Link>
  )
}

interface DashboardClientProps {
  dados: DashboardResponseDto
  nomeMembro: string
}

export default function DashboardClient({ dados, nomeMembro }: DashboardClientProps) {
  const primeiroNome = nomeMembro.split(" ")[0] ?? nomeMembro

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Olá, {primeiroNome} 👋
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Aqui está um resumo do seu ministério.
        </p>
      </div>

      {/* Cards de métricas */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Visão geral
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            label="Membros ativos"
            valor={dados.totalMembros}
            icone="🎵"
            cor="bg-violet-100"
            href="/membros"
          />
          <MetricCard
            label="Músicas no catálogo"
            valor={dados.totalMusicas}
            icone="🎶"
            cor="bg-blue-100"
            href="/musicas"
          />
          <MetricCard
            label={`Cultos em ${new Date().toLocaleDateString("pt-BR", { month: "long" })}`}
            valor={dados.totalCultosNoMes}
            icone="📅"
            cor="bg-emerald-100"
            href="/cultos"
          />
        </div>
      </section>

      {/* Próximos cultos */}
      <section className="bg-white border border-zinc-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-800">Próximos cultos</h2>
          <Link href="/cultos" className="text-xs text-violet-600 hover:underline">
            Ver todos →
          </Link>
        </div>

        {dados.proximosCultos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-400">Nenhum culto agendado.</p>
            <Link
              href="/cultos/novo"
              className="mt-2 inline-block text-sm text-violet-600 hover:underline"
            >
              Criar culto
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {dados.proximosCultos.map((culto) => (
              <CultoCard key={culto.id} culto={culto} />
            ))}
          </div>
        )}
      </section>

      {/* Atalhos */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/membros/novo", label: "Novo membro", icone: "👤" },
            { href: "/cultos/novo", label: "Novo culto", icone: "📋" },
            { href: "/musicas/nova", label: "Nova música", icone: "🎸" },
            { href: "/repertorio", label: "Repertórios", icone: "📝" },
          ].map(({ href, label, icone }) => (
            <Link
              key={href}
              href={href}
              className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-violet-300 hover:shadow-sm transition-all"
            >
              <span className="text-2xl">{icone}</span>
              <span className="text-xs font-medium text-zinc-600">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
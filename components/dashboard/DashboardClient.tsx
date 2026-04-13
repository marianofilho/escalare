// src/components/dashboard/DashboardClient.tsx
"use client"

import Link from "next/link"
import { formatarTipoCulto, formatarDataHora } from "@/utils/culto"

interface InscricaoComMembro {
  membro: { nome: string }
}

interface CultoResumido {
  id: string
  tipo: string
  dataHoraInicio: Date
  status: string
  inscricoes: InscricaoComMembro[]
}

interface DashboardClientProps {
  nomeMembro: string
  nomeIgreja: string
  totalMembros: number
  totalMusicas: number
  proximosCultos: CultoResumido[]
}

export default function DashboardClient({
  nomeMembro,
  nomeIgreja,
  totalMembros,
  totalMusicas,
  proximosCultos,
}: DashboardClientProps) {
  const primeiroNome = nomeMembro.split(" ")[0]

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Boas-vindas */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">
          Olá, {primeiroNome}! 👋
        </h1>
        <p className="text-zinc-500 mt-1 text-base">
          Bem-vindo ao painel do ministério {nomeIgreja}.
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <MetricCard
          label="Membros ativos"
          value={totalMembros}
          icon="👥"
          href="/membros"
          cor="bg-violet-50 border-violet-100"
          corValor="text-violet-700"
        />
        <MetricCard
          label="Músicas no catálogo"
          value={totalMusicas}
          icon="🎶"
          href="/musicas"
          cor="bg-sky-50 border-sky-100"
          corValor="text-sky-700"
        />
        <MetricCard
          label="Próximos cultos"
          value={proximosCultos.length}
          icon="🗓️"
          href="/cultos"
          cor="bg-emerald-50 border-emerald-100"
          corValor="text-emerald-700"
        />
      </div>

      {/* Próximos cultos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-800">Próximos cultos</h2>
          <Link
            href="/cultos"
            className="text-sm text-violet-600 hover:text-violet-800 transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {proximosCultos.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-zinc-400 text-sm">Nenhum culto agendado no momento.</p>
            <Link
              href="/cultos/novo"
              className="mt-3 inline-block text-sm text-violet-600 hover:underline"
            >
              Criar novo culto
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proximosCultos.map((culto) => (
              <CultoCard key={culto.id} culto={culto} />
            ))}
          </div>
        )}
      </section>

      {/* Ações rápidas */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AcaoRapida href="/membros/novo" icon="➕" label="Novo membro" />
          <AcaoRapida href="/cultos/novo" icon="📅" label="Novo culto" />
          <AcaoRapida href="/musicas/nova" icon="🎵" label="Nova música" />
          <AcaoRapida href="/repertorio" icon="📋" label="Repertório" />
        </div>
      </section>
    </main>
  )
}

function MetricCard({
  label, value, icon, href, cor, corValor,
}: {
  label: string
  value: number
  icon: string
  href: string
  cor: string
  corValor: string
}) {
  return (
    <Link
      href={href}
      className={`${cor} border rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow`}
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-3xl font-bold ${corValor}`}>{value}</p>
      </div>
    </Link>
  )
}

function CultoCard({ culto }: { culto: CultoResumido }) {
  const inscritos = culto.inscricoes.length
  const map: Record<string, { label: string; className: string }> = {
    ABERTO: { label: "Aberto", className: "bg-emerald-100 text-emerald-700" },
    FECHADO: { label: "Fechado", className: "bg-amber-100 text-amber-700" },
    REALIZADO: { label: "Realizado", className: "bg-zinc-100 text-zinc-500" },
  }
  const { label, className } = map[culto.status] ?? { label: culto.status, className: "bg-zinc-100 text-zinc-500" }

  return (
    <Link
      href={`/cultos/${culto.id}`}
      className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between hover:border-violet-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg">
          🎤
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800">
            {formatarTipoCulto(culto.tipo)}
          </p>
          <p className="text-xs text-zinc-400">
            {formatarDataHora(culto.dataHoraInicio)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">{inscritos} inscrito{inscritos !== 1 ? "s" : ""}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
          {label}
        </span>
      </div>
    </Link>
  )
}

function AcaoRapida({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-violet-300 hover:bg-violet-50 transition-all text-center"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-zinc-600 font-medium">{label}</span>
    </Link>
  )
}
// src/components/dashboard/NavBar.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import BuscaGlobal from "@/components/dashboard/BuscaGlobal"

interface NavBarProps {
  nomeMembro: string
  fotoPerfil?: string | null
  isAdmin?: boolean
}

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/membros", label: "Membros" },
  { href: "/cultos", label: "Cultos" },
  { href: "/musicas", label: "Musicas" },
  { href: "/repertorio", label: "Repertorio" },
]

export default function NavBar({ nomeMembro, fotoPerfil, isAdmin }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuAberto, setMenuAberto] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [pendentes, setPendentes] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const primeiroNome = nomeMembro.split(" ")[0]
  const iniciais = nomeMembro
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")

  // Atalho de teclado Cmd+K / Ctrl+K para abrir busca
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setBuscaAberta((v) => !v)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    async function buscarPendentes() {
      try {
        const res = await fetch("/api/solicitacoes/pendentes/count")
        if (res.ok) {
          const data = await res.json()
          setPendentes(data.total ?? 0)
        }
      } catch { /* silencia */ }
    }
    buscarPendentes()
    const interval = setInterval(buscarPendentes, 60_000)
    return () => clearInterval(interval)
  }, [isAdmin])

  useEffect(() => {
    if (pathname.startsWith("/admin/solicitacoes")) {
      setPendentes(0)
    }
  }, [pathname])

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener("mousedown", handleClickFora)
    return () => document.removeEventListener("mousedown", handleClickFora)
  }, [])

  async function handleLogout() {
    setSaindo(true)
    setMenuAberto(false)
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🎵</span>
            <span className="text-sm font-semibold text-zinc-800 hidden sm:block">Ministerio</span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {LINKS.map((link) => {
              const ativo = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
              return (
                <Link key={link.href} href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    ativo ? "bg-violet-50 text-violet-700 font-medium" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}>
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botão de busca */}
            <button
              onClick={() => setBuscaAberta(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              title="Busca global (Ctrl+K)"
            >
              <span className="text-base">🔍</span>
              <kbd className="hidden sm:inline text-xs bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Badge de solicitações */}
            {isAdmin && (
              <Link href="/admin/solicitacoes"
                className={`relative p-1.5 rounded-lg transition-colors ${
                  pathname.startsWith("/admin/solicitacoes") ? "bg-violet-50 text-violet-700" : "text-zinc-500 hover:bg-zinc-100"
                }`}
                title="Solicitacoes de vinculo">
                <span className="text-lg">🔔</span>
                {pendentes > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {pendentes > 9 ? "9+" : pendentes}
                  </span>
                )}
              </Link>
            )}

            {/* Avatar com dropdown */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuAberto((v) => !v)}
                className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-violet-400 transition-all focus:outline-none focus:ring-violet-500"
                title={primeiroNome}>
                {fotoPerfil ? (
                  <Image src={fotoPerfil} alt={nomeMembro} width={36} height={36} className="object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                    {iniciais}
                  </div>
                )}
              </button>

              {menuAberto && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-20">
                  <div className="px-4 py-3 border-b border-zinc-100">
                    <p className="text-sm font-semibold text-zinc-800 truncate">{nomeMembro}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/perfil" onClick={() => setMenuAberto(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                      <span>👤</span> Meu perfil
                    </Link>
                    {isAdmin && (
                      <Link href="/admin/solicitacoes" onClick={() => { setMenuAberto(false); setPendentes(0) }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                        <span>🔔</span>
                        Solicitacoes
                        {pendentes > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendentes}</span>
                        )}
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-zinc-100 py-1">
                    <button onClick={handleLogout} disabled={saindo}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      <span>🚪</span> {saindo ? "Saindo..." : "Sair"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal de busca */}
      {buscaAberta && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setBuscaAberta(false) }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
            <BuscaGlobal onFechar={() => setBuscaAberta(false)} />
          </div>
        </div>
      )}
    </>
  )
}
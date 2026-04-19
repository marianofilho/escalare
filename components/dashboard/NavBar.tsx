// src/components/dashboard/NavBar.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { useState, useRef, useEffect } from "react"

interface NavBarProps {
  nomeMembro: string
  fotoPerfil?: string | null
}

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/membros", label: "Membros" },
  { href: "/cultos", label: "Cultos" },
  { href: "/musicas", label: "Músicas" },
  { href: "/repertorio", label: "Repertório" },
]

export default function NavBar({ nomeMembro, fotoPerfil }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuAberto, setMenuAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const primeiroNome = nomeMembro.split(" ")[0]
  const iniciais = nomeMembro
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")

  // Fecha ao clicar fora
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
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🎵</span>
          <span className="text-sm font-semibold text-zinc-800 hidden sm:block">
            Ministério
          </span>
        </Link>

        {/* Navegação */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const ativo =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  ativo
                    ? "bg-violet-50 text-violet-700 font-medium"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Avatar com dropdown */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-violet-400 transition-all focus:outline-none focus:ring-violet-500"
            title={primeiroNome}
          >
            {fotoPerfil ? (
              <img src={fotoPerfil} alt={nomeMembro} className="w-9 h-9 object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                {iniciais}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {menuAberto && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-20">
              <div className="px-4 py-3 border-b border-zinc-100">
                <p className="text-sm font-semibold text-zinc-800 truncate">{nomeMembro}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/perfil"
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-base">👤</span>
                  Meu perfil
                </Link>
              </div>

              <div className="border-t border-zinc-100 py-1">
                <button
                  onClick={handleLogout}
                  disabled={saindo}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <span className="text-base">🚪</span>
                  {saindo ? "Saindo..." : "Sair"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
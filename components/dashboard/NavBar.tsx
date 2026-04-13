// src/components/dashboard/NavBar.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { useState } from "react"

interface NavBarProps {
  nomeMembro: string
}

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/membros", label: "Membros" },
  { href: "/cultos", label: "Cultos" },
  { href: "/musicas", label: "Músicas" },
  { href: "/repertorio", label: "Repertório" },
]

export default function NavBar({ nomeMembro }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  async function handleLogout() {
    setSaindo(true)
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const primeiroNome = nomeMembro.split(" ")[0]

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

        {/* Usuário + logout */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-zinc-500 hidden sm:block">
            {primeiroNome}
          </span>
          <button
            onClick={handleLogout}
            disabled={saindo}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-50"
          >
            {saindo ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    </header>
  )
}
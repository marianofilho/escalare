// src/app/(dashboard)/layout.tsx
import { getServerSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import NavBar from "@/components/dashboard/NavBar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerSession()
  if (!user) redirect("/login")

  const nomeMembro = user.user_metadata?.nome as string | undefined

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavBar nomeMembro={nomeMembro ?? ""} />
      <div>{children}</div>
    </div>
  )
}
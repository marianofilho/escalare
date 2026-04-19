// src/app/(dashboard)/page.tsx
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { makeDashboardService } from "@/lib/factories"
import DashboardClient from "@/components/dashboard/DashboardClient"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  const igrejaId = session.user.user_metadata?.igrejaId as string
  const nomeMembro = (session.user.user_metadata?.nome as string | undefined) ?? "Membro"

  const dados = await makeDashboardService().buscarResumo(igrejaId)

  return <DashboardClient dados={dados} nomeMembro={nomeMembro} />
}
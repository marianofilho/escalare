// src/app/api/membros/[id]/resetar-senha/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient, getServerSession } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { Resend } from "resend"
import { makeMembroService } from "@/lib/factories"
import { IgrejaRepository } from "@/repositories/igreja.repository"
import { handleApiError } from "@/lib/api-error-handler"
import { resolveSession } from "@/lib/resolve-session"

const resend = new Resend(process.env.RESEND_API_KEY)

function gerarSenhaAleatoria(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let senha = ""
  for (let i = 0; i < 10; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

function emailResetSenha({
  nome,
  email,
  senhaTemporaria,
  nomeIgreja,
  appUrl,
}: {
  nome: string
  email: string
  senhaTemporaria: string
  nomeIgreja: string
  appUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
        <tr>
          <td style="background:#7c3aed;padding:32px;text-align:center;">
            <p style="margin:0;font-size:28px;">🔑</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:600;">${nomeIgreja}</h1>
            <p style="margin:4px 0 0;color:#ddd6fe;font-size:13px;">Ministerio de Louvor</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:16px;color:#18181b;">Ola, <strong>${nome}</strong>!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
              Sua senha foi redefinida pelo administrador. Use as credenciais abaixo para acessar.
              Voce sera solicitado a criar uma nova senha no proximo acesso.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px;">
              <tr>
                <td style="padding-bottom:12px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.06em;font-weight:600;">Email</p>
                  <p style="margin:0;font-size:14px;color:#18181b;font-family:monospace;">${email}</p>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #e4e4e7;padding-top:12px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.06em;font-weight:600;">Senha temporaria</p>
                  <p style="margin:0;font-size:22px;color:#18181b;font-family:monospace;font-weight:700;letter-spacing:.15em;">${senhaTemporaria}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${appUrl}/login" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                    Acessar o sistema
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;line-height:1.6;">
              Se voce nao solicitou esta redefinicao, entre em contato com o administrador.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: membroIdAlvo } = await params

    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

    const resolved = await resolveSession(session)
    if (!resolved) return NextResponse.json({ error: "Membro não encontrado" }, { status: 403 })
    
    const { igrejaId, membroId } = resolved

    // Verifica que e admin
    const membroAtual = await makeMembroService().buscarPorId(membroId, igrejaId)
    if (membroAtual.perfil !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Apenas administradores podem redefinir senhas" },
        { status: 403 }
      )
    }

    // Busca o membro alvo
    const membroAlvo = await makeMembroService().buscarPorId(membroIdAlvo, igrejaId)

    if (!membroAlvo.supabaseId) {
      return NextResponse.json(
        { error: "Este membro ainda nao tem acesso ao sistema cadastrado" },
        { status: 400 }
      )
    }

    const senhaTemporaria = gerarSenhaAleatoria()

    // Atualiza senha e flag no Supabase Auth via admin
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      membroAlvo.supabaseId,
      {
        password: senhaTemporaria,
        user_metadata: {
          precisaTrocarSenha: true,
        },
      }
    )

    if (authError) {
      console.error("[POST /api/membros/[id]/resetar-senha]", authError.message)
      return NextResponse.json(
        { error: "Erro ao redefinir senha no sistema de autenticacao" },
        { status: 500 }
      )
    }

    // Tenta enviar email com nova senha temporaria
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const nomeIgreja = await new IgrejaRepository().findNome(igrejaId) ?? "Ministerio de Louvor"

    let emailEnviado = false
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to: membroAlvo.email,
        subject: "Sua senha foi redefinida — Ministerio de Louvor",
        html: emailResetSenha({
          nome: membroAlvo.nome,
          email: membroAlvo.email,
          senhaTemporaria,
          nomeIgreja,
          appUrl,
        }),
      })
      emailEnviado = true
    } catch (emailError) {
      console.error("[POST /api/membros/[id]/resetar-senha] Erro ao enviar email:", emailError)
    }

    return NextResponse.json({
      senhaTemporaria,
      emailEnviado,
      email: membroAlvo.email,
      nome: membroAlvo.nome,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
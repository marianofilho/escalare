// src/app/api/membros/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { Resend } from "resend"
import { CriarMembroSchema } from "@/dtos/membro/criar-membro.dto"
import { MembroResponseDto } from "@/dtos/membro/membro-response.dto"
import { makeMembroService } from "@/lib/factories"
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

function emailBoasVindas({
  nome, email, senhaTemporaria, nomeIgreja, appUrl,
}: {
  nome: string
  email: string
  senhaTemporaria: string
  nomeIgreja: string
  appUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
        <tr>
          <td style="background:#7c3aed;padding:32px;text-align:center;">
            <p style="margin:0;font-size:28px;">🎵</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:600;">${nomeIgreja}</h1>
            <p style="margin:4px 0 0;color:#ddd6fe;font-size:13px;">Ministério de Louvor</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:16px;color:#18181b;">Olá, <strong>${nome}</strong>!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
              Você foi cadastrado no sistema do ministério. Use as credenciais abaixo para acessar.
              Você será solicitado a criar uma nova senha no primeiro acesso.
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
                  <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.06em;font-weight:600;">Senha temporária</p>
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
              ⚠️ Por segurança, você será obrigado a trocar a senha no primeiro acesso.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const resolved = await resolveSession(session)
    if (!resolved) return NextResponse.json({ error: "Membro não encontrado" }, { status: 403 })

    const { igrejaId } = resolved

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "ATIVO" | "INATIVO" | null
    const perfil = searchParams.get("perfil") ?? undefined

    const membros = await makeMembroService().listarPaginado(igrejaId, {
      ...(status ? { status } : {}),
      ...(perfil ? { perfil } : {}),
    })

    return NextResponse.json({
      ...membros,
      data: membros.data.map(MembroResponseDto.from),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const resolved = await resolveSession(session)
    if (!resolved) return NextResponse.json({ error: "Membro não encontrado" }, { status: 403 })

    const { igrejaId, membroId } = resolved

    // Verifica perfil no banco — fonte confiável
    const service = makeMembroService()
    const membroAtual = await service.buscarPorId(membroId, igrejaId)
    if (membroAtual.perfil !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Apenas administradores podem cadastrar membros" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const dto = CriarMembroSchema.parse(body)
    const membro = await service.criar(dto, igrejaId)

    // Gera senha aleatória
    const senhaTemporaria = gerarSenhaAleatoria()

    // Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: membro.email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome: membro.nome,
        igrejaId: membro.igrejaId,
        membroId: membro.id,
        perfil: membro.perfil,
        precisaTrocarSenha: true,
      },
    })

    if (authError) {
      console.error("[POST /api/membros] Erro Supabase Auth:", authError.message)
      return NextResponse.json(
        {
          ...MembroResponseDto.from(membro),
          senhaTemporaria: null,
          emailEnviado: false,
          aviso: "Membro criado no sistema, mas houve erro ao criar o acesso. Contate o suporte.",
        },
        { status: 201 }
      )
    }

    // Atualiza supabaseId no banco
    await service.atualizarSupabaseId(membro.id, igrejaId, authData.user.id)

    // Envia email com credenciais via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    let emailEnviado = false
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to: membro.email,
        subject: "Seu acesso ao Ministério de Louvor",
        html: emailBoasVindas({
          nome: membro.nome,
          email: membro.email,
          senhaTemporaria,
          nomeIgreja: "Ministério de Louvor",
          appUrl,
        }),
      })
      emailEnviado = true
    } catch (emailError) {
      console.error("[POST /api/membros] Erro ao enviar email:", emailError)
    }

    return NextResponse.json(
      { ...MembroResponseDto.from(membro), senhaTemporaria, emailEnviado },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
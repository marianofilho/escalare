// src/services/email.service.ts
import { Resend } from "resend"

const TIPO_LABEL: Record<string, string> = {
  CULTO_DOMINGO_MANHA: "Culto Domingo Manha",
  CULTO_DOMINGO_NOITE: "Culto Domingo Noite",
  CULTO_SEMANA: "Culto de Semana",
  ENSAIO: "Ensaio",
  SEMANA_ORACAO: "Semana de Oracao",
  ESPECIAL: "Culto Especial",
  OUTRO: "Culto",
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function emailEscala({
  nomeMembro,
  nomeIgreja,
  tipoCulto,
  subtipo,
  dataHoraInicio,
  cultoId,
  appUrl,
}: {
  nomeMembro: string
  nomeIgreja: string
  tipoCulto: string
  subtipo: string | null
  dataHoraInicio: string
  cultoId: string
  appUrl: string
}): string {
  const tipoLabel = TIPO_LABEL[tipoCulto] ?? tipoCulto
  const titulo = subtipo ? `${tipoLabel} — ${subtipo}` : tipoLabel
  const data = formatarData(dataHoraInicio)
  const link = `${appUrl}/cultos/${cultoId}`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
        <tr>
          <td style="background:#7c3aed;padding:32px;text-align:center;">
            <p style="margin:0;font-size:28px;">🎵</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:600;">${nomeIgreja}</h1>
            <p style="margin:4px 0 0;color:#ddd6fe;font-size:13px;">Ministerio de Louvor</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:16px;color:#18181b;">
              Ola, <strong>${nomeMembro}</strong>!
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
              As inscricoes para o proximo culto estao abertas. Confirme sua presenca no sistema.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9f7ff;border:1px solid #ede9fe;border-radius:12px;padding:20px;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;color:#7c3aed;text-transform:uppercase;letter-spacing:.06em;font-weight:600;">Culto</p>
                  <p style="margin:0 0 12px;font-size:17px;color:#18181b;font-weight:700;">${titulo}</p>
                  <p style="margin:0;font-size:13px;color:#52525b;">📅 ${data}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${link}"
                    style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;">
                    Ver culto e se inscrever
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
              Ou acesse: <a href="${link}" style="color:#7c3aed;">${link}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;border-top:1px solid #f4f4f5;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">
              Voce recebeu este email porque e membro do ministerio de louvor.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export interface EnviarEscalaParams {
  membros: { nome: string; email: string }[]
  nomeIgreja: string
  tipoCulto: string
  subtipo: string | null
  dataHoraInicio: string
  cultoId: string
}

// Interface para facilitar o mock nos testes
export interface IResendClient {
  emails: {
    send: (params: {
      from: string
      to: string
      subject: string
      html: string
    }) => Promise<unknown>
  }
}

export class EmailService {
  private readonly from: string
  private readonly appUrl: string

  constructor(
    private readonly resendClient: IResendClient,
    from?: string,
    appUrl?: string
  ) {
    this.from = from ?? process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"
    this.appUrl = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  }

  async notificarEscala(params: EnviarEscalaParams): Promise<{ enviados: number; erros: number }> {
    const { membros, nomeIgreja, tipoCulto, subtipo, dataHoraInicio, cultoId } = params
    const tipoLabel = TIPO_LABEL[tipoCulto] ?? tipoCulto
    const assunto = `🎵 Nova escala disponivel — ${tipoLabel}`

    const resultados = await Promise.allSettled(
      membros.map((m) =>
        this.resendClient.emails.send({
          from: this.from,
          to: m.email,
          subject: assunto,
          html: emailEscala({
            nomeMembro: m.nome.split(" ")[0],
            nomeIgreja,
            tipoCulto,
            subtipo,
            dataHoraInicio,
            cultoId,
            appUrl: this.appUrl,
          }),
        })
      )
    )

    const enviados = resultados.filter((r) => r.status === "fulfilled").length
    const erros = resultados.filter((r) => r.status === "rejected").length

    if (erros > 0) {
      console.error(`[EmailService] ${erros} email(s) falharam de ${membros.length} total`)
    }

    return { enviados, erros }
  }
}

export function makeEmailService(): EmailService {
  return new EmailService(new Resend(process.env.RESEND_API_KEY))
}
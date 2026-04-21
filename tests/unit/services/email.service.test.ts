// tests/unit/services/email.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { EmailService, type IResendClient, type EnviarEscalaParams } from "@/services/email.service"

// ── helper ────────────────────────────────────────────────────────────────────

function makeResendMock(): jest.Mocked<IResendClient> {
  return {
    emails: {
      send: vi.fn().mockResolvedValue({ id: "email-id-123" }),
    },
  }
}

function makeParams(overrides: Partial<EnviarEscalaParams> = {}): EnviarEscalaParams {
  return {
    membros: [
      { nome: "Ana Silva", email: "ana@teste.com" },
      { nome: "Bruno Costa", email: "bruno@teste.com" },
    ],
    nomeIgreja: "Igreja Teste",
    tipoCulto: "CULTO_DOMINGO_MANHA",
    subtipo: null,
    dataHoraInicio: new Date("2025-06-01T09:00:00Z").toISOString(),
    cultoId: "culto-123",
    ...overrides,
  }
}

// ── testes ────────────────────────────────────────────────────────────────────

describe("EmailService", () => {
  let resendMock: ReturnType<typeof makeResendMock>
  let service: EmailService

  beforeEach(() => {
    resendMock = makeResendMock()
    service = new EmailService(resendMock, "noreply@teste.com", "http://localhost:3000")
  })

  describe("notificarEscala", () => {
    it("envia um email para cada membro", async () => {
      const params = makeParams()

      const resultado = await service.notificarEscala(params)

      expect(resendMock.emails.send).toHaveBeenCalledTimes(2)
      expect(resultado.enviados).toBe(2)
      expect(resultado.erros).toBe(0)
    })

    it("envia para o email correto de cada membro", async () => {
      const params = makeParams()

      await service.notificarEscala(params)

      const chamadas = resendMock.emails.send.mock.calls
      expect(chamadas[0][0].to).toBe("ana@teste.com")
      expect(chamadas[1][0].to).toBe("bruno@teste.com")
    })

    it("usa o remetente configurado", async () => {
      await service.notificarEscala(makeParams())

      const chamada = resendMock.emails.send.mock.calls[0][0]
      expect(chamada.from).toBe("noreply@teste.com")
    })

    it("inclui o tipo do culto no assunto", async () => {
      await service.notificarEscala(makeParams({ tipoCulto: "CULTO_DOMINGO_MANHA" }))

      const chamada = resendMock.emails.send.mock.calls[0][0]
      expect(chamada.subject).toContain("Culto Domingo Manha")
    })

    it("inclui o link para o culto no HTML", async () => {
      await service.notificarEscala(makeParams({ cultoId: "culto-abc" }))

      const html = resendMock.emails.send.mock.calls[0][0].html
      expect(html).toContain("http://localhost:3000/cultos/culto-abc")
    })

    it("usa apenas o primeiro nome do membro no email", async () => {
      await service.notificarEscala(
        makeParams({ membros: [{ nome: "Ana Carolina Silva", email: "ana@teste.com" }] })
      )

      const html = resendMock.emails.send.mock.calls[0][0].html
      expect(html).toContain("Ana")
      expect(html).not.toContain("Carolina")
    })

    it("inclui subtipo no titulo quando informado", async () => {
      await service.notificarEscala(
        makeParams({ tipoCulto: "ESPECIAL", subtipo: "Louvor de Pascoa" })
      )

      const html = resendMock.emails.send.mock.calls[0][0].html
      expect(html).toContain("Culto Especial")
      expect(html).toContain("Louvor de Pascoa")
    })

    it("nao inclui separador quando subtipo e null", async () => {
      await service.notificarEscala(makeParams({ subtipo: null }))

      const html = resendMock.emails.send.mock.calls[0][0].html
      expect(html).not.toContain("null")
    })

    it("contabiliza erros sem lancar excecao", async () => {
      // Primeiro membro ok, segundo falha
      resendMock.emails.send
        .mockResolvedValueOnce({ id: "ok" })
        .mockRejectedValueOnce(new Error("Falha no envio"))

      const resultado = await service.notificarEscala(makeParams())

      expect(resultado.enviados).toBe(1)
      expect(resultado.erros).toBe(1)
    })

    it("retorna zero enviados quando todos falham", async () => {
      resendMock.emails.send.mockRejectedValue(new Error("Servico indisponivel"))

      const resultado = await service.notificarEscala(makeParams())

      expect(resultado.enviados).toBe(0)
      expect(resultado.erros).toBe(2)
    })

    it("retorna zero enviados e nao chama send quando lista vazia", async () => {
      const resultado = await service.notificarEscala(makeParams({ membros: [] }))

      expect(resendMock.emails.send).not.toHaveBeenCalled()
      expect(resultado.enviados).toBe(0)
      expect(resultado.erros).toBe(0)
    })

    it("inclui o nome da igreja no HTML", async () => {
      await service.notificarEscala(makeParams({ nomeIgreja: "Igreja Genesys" }))

      const html = resendMock.emails.send.mock.calls[0][0].html
      expect(html).toContain("Igreja Genesys")
    })

    it("usa tipo OUTRO como fallback para tipo desconhecido", async () => {
      await service.notificarEscala(makeParams({ tipoCulto: "TIPO_INEXISTENTE" }))

      const chamada = resendMock.emails.send.mock.calls[0][0]
      expect(chamada.subject).toContain("TIPO_INEXISTENTE")
    })
  })
})
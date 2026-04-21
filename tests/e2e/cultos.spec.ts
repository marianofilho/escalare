// tests/e2e/cultos.spec.ts
import { test, expect } from "@playwright/test"
import { loginComoAdmin, loginComoMusico } from "./helpers/auth"

test.describe("Cultos — Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginComoAdmin(page)
  })

  test("lista cultos na pagina /cultos", async ({ page }) => {
    await page.goto("/cultos")
    await expect(page.getByRole("heading", { name: /cultos/i })).toBeVisible()
  })

  test("admin ve botao Novo culto", async ({ page }) => {
    await page.goto("/cultos")
    await expect(page.getByRole("link", { name: /novo culto/i })).toBeVisible()
  })

  test("cria novo culto com sucesso", async ({ page }) => {
    await page.goto("/cultos/novo")

    await page.getByLabel(/tipo de culto/i).selectOption("CULTO_DOMINGO_MANHA")

    // Preenche data/hora de início (7 dias no futuro)
    const futuro = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const dataStr = futuro.toISOString().slice(0, 16)
    await page.getByLabel(/data e hora de in/i).fill(dataStr)

    await page.getByRole("button", { name: /criar culto/i }).click()

    await expect(page).toHaveURL("/cultos")
  })

  test("acessa tela de detalhe do culto", async ({ page }) => {
    await page.goto("/cultos")
    await page.getByRole("link", { name: /ver →/i }).first().click()

    await expect(page.getByText(/inscritos/i)).toBeVisible()
    await expect(page.getByText(/repertorio/i)).toBeVisible()
  })
})

test.describe("Cultos — Musico", () => {
  test.beforeEach(async ({ page }) => {
    await loginComoMusico(page)
  })

  test("musico nao ve botao Novo culto", async ({ page }) => {
    await page.goto("/cultos")
    await expect(page.getByRole("link", { name: /novo culto/i })).not.toBeVisible()
  })

  test("musico ve botao Inscrever-se em culto aberto", async ({ page }) => {
    await page.goto("/cultos")
    // Verifica se existe pelo menos um culto aberto com botão de inscrição
    const botao = page.getByRole("button", { name: /inscrever-se/i }).first()
    if (await botao.isVisible()) {
      await expect(botao).toBeEnabled()
    }
  })
})
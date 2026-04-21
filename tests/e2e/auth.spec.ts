// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Autenticacao", () => {
  test("redireciona para /login sem sessao", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("redireciona para /login ao acessar rota protegida", async ({ page }) => {
    await page.goto("/membros")
    await expect(page).toHaveURL(/\/login/)
  })

  test("login com credenciais invalidas exibe erro", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/e-mail/i).fill("naoexiste@teste.com")
    await page.getByLabel(/senha/i).fill("senhaerrada")
    await page.getByRole("button", { name: /entrar/i }).click()

    await expect(page.getByText(/invalido|incorreto|nao encontrado/i)).toBeVisible()
  })

  test("login com credenciais validas redireciona para /", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/e-mail/i).fill(process.env.E2E_ADMIN_EMAIL!)
    await page.getByLabel(/senha/i).fill(process.env.E2E_ADMIN_SENHA!)
    await page.getByRole("button", { name: /entrar/i }).click()

    await expect(page).toHaveURL("/")
    await expect(page.getByText(/ministerio/i)).toBeVisible()
  })

  test("logout redireciona para /login", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/e-mail/i).fill(process.env.E2E_ADMIN_EMAIL!)
    await page.getByLabel(/senha/i).fill(process.env.E2E_ADMIN_SENHA!)
    await page.getByRole("button", { name: /entrar/i }).click()
    await page.waitForURL("/")

    // Abre dropdown do avatar e clica em Sair
    await page.locator("header button[title]").click()
    await page.getByRole("button", { name: /sair/i }).click()

    await expect(page).toHaveURL(/\/login/)
  })
})
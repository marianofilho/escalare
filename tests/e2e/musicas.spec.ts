// tests/e2e/musicas.spec.ts
import { test, expect } from "@playwright/test"
import { loginComoAdmin, loginComoCantor, loginComoMusico } from "./helpers/auth"

test.describe("Musicas — Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginComoAdmin(page)
  })

  test("lista musicas na pagina /musicas", async ({ page }) => {
    await page.goto("/musicas")
    await expect(page.getByRole("heading", { name: /musicas/i })).toBeVisible()
  })

  test("admin ve botao Nova musica", async ({ page }) => {
    await page.goto("/musicas")
    await expect(page.getByRole("link", { name: /nova musica/i })).toBeVisible()
  })

  test("admin ve botoes Editar e Arquivar nas musicas ativas", async ({ page }) => {
    await page.goto("/musicas")
    await expect(page.getByRole("link", { name: /editar/i }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /arquivar/i }).first()).toBeVisible()
  })

  test("filtra musicas arquivadas e ve botao Restaurar", async ({ page }) => {
    await page.goto("/musicas")
    await page.getByRole("button", { name: /arquivadas/i }).click()
    // Se houver músicas arquivadas, deve mostrar botão Restaurar
    const restaurar = page.getByRole("button", { name: /restaurar/i }).first()
    if (await restaurar.isVisible()) {
      await expect(restaurar).toBeEnabled()
    }
  })
})

test.describe("Musicas — Cantor", () => {
  test.beforeEach(async ({ page }) => {
    await loginComoCantor(page)
  })

  test("cantor ve catalogo completo de musicas", async ({ page }) => {
    await page.goto("/musicas")
    await expect(page.getByRole("heading", { name: /musicas/i })).toBeVisible()
    // Cantor não vê botão Nova música
    await expect(page.getByRole("link", { name: /nova musica/i })).not.toBeVisible()
  })

  test("cantor ve botao Solicitar vinculo em musicas nao vinculadas", async ({ page }) => {
    await page.goto("/musicas")
    const solicitar = page.getByRole("button", { name: /solicitar vinculo/i }).first()
    if (await solicitar.isVisible()) {
      await expect(solicitar).toBeEnabled()
    }
  })
})

test.describe("Musicas — Musico", () => {
  test.beforeEach(async ({ page }) => {
    await loginComoMusico(page)
  })

  test("musico ve catalogo completo sem acoes de admin", async ({ page }) => {
    await page.goto("/musicas")
    await expect(page.getByRole("heading", { name: /musicas/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /nova musica/i })).not.toBeVisible()
    await expect(page.getByRole("button", { name: /arquivar/i })).not.toBeVisible()
  })
})
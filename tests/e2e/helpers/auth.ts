// tests/e2e/helpers/auth.ts
import { type Page } from "@playwright/test"

export async function loginComoAdmin(page: Page) {
  await page.goto("/login")
  await page.getByLabel(/e-mail/i).fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel(/senha/i).fill(process.env.E2E_ADMIN_SENHA!)
  await page.getByRole("button", { name: /entrar/i }).click()
  await page.waitForURL("/")
}

export async function loginComoCantor(page: Page) {
  await page.goto("/login")
  await page.getByLabel(/e-mail/i).fill(process.env.E2E_CANTOR_EMAIL!)
  await page.getByLabel(/senha/i).fill(process.env.E2E_CANTOR_SENHA!)
  await page.getByRole("button", { name: /entrar/i }).click()
  await page.waitForURL("/")
}

export async function loginComoMusico(page: Page) {
  await page.goto("/login")
  await page.getByLabel(/e-mail/i).fill(process.env.E2E_MUSICO_EMAIL!)
  await page.getByLabel(/senha/i).fill(process.env.E2E_MUSICO_SENHA!)
  await page.getByRole("button", { name: /entrar/i }).click()
  await page.waitForURL("/")
}
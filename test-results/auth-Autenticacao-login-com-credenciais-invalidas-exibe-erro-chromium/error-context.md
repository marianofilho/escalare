# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Autenticacao >> login com credenciais invalidas exibe erro
- Location: tests\e2e\auth.spec.ts:15:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/e-mail/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - heading "Ministério de Louvor" [level=1] [ref=e5]
        - paragraph [ref=e6]: Acesse sua conta
      - generic [ref=e7]:
        - generic [ref=e8]:
          - generic [ref=e9]: Email
          - textbox "Email" [ref=e10]:
            - /placeholder: seu@email.com
        - generic [ref=e11]:
          - generic [ref=e12]: Senha
          - textbox "Senha" [ref=e13]:
            - /placeholder: ••••••••
        - button "Entrar" [ref=e14]
        - paragraph [ref=e15]:
          - text: Não tem conta?
          - link "Cadastrar ministério" [ref=e16] [cursor=pointer]:
            - /url: /cadastro
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
  - alert [ref=e26]
```

# Test source

```ts
  1  | // tests/e2e/auth.spec.ts
  2  | import { test, expect } from "@playwright/test"
  3  | 
  4  | test.describe("Autenticacao", () => {
  5  |   test("redireciona para /login sem sessao", async ({ page }) => {
  6  |     await page.goto("/")
  7  |     await expect(page).toHaveURL(/\/login/)
  8  |   })
  9  | 
  10 |   test("redireciona para /login ao acessar rota protegida", async ({ page }) => {
  11 |     await page.goto("/membros")
  12 |     await expect(page).toHaveURL(/\/login/)
  13 |   })
  14 | 
  15 |   test("login com credenciais invalidas exibe erro", async ({ page }) => {
  16 |     await page.goto("/login")
> 17 |     await page.getByLabel(/e-mail/i).fill("naoexiste@teste.com")
     |                                      ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  18 |     await page.getByLabel(/senha/i).fill("senhaerrada")
  19 |     await page.getByRole("button", { name: /entrar/i }).click()
  20 | 
  21 |     await expect(page.getByText(/invalido|incorreto|nao encontrado/i)).toBeVisible()
  22 |   })
  23 | 
  24 |   test("login com credenciais validas redireciona para /", async ({ page }) => {
  25 |     await page.goto("/login")
  26 |     await page.getByLabel(/e-mail/i).fill(process.env.E2E_ADMIN_EMAIL!)
  27 |     await page.getByLabel(/senha/i).fill(process.env.E2E_ADMIN_SENHA!)
  28 |     await page.getByRole("button", { name: /entrar/i }).click()
  29 | 
  30 |     await expect(page).toHaveURL("/")
  31 |     await expect(page.getByText(/ministerio/i)).toBeVisible()
  32 |   })
  33 | 
  34 |   test("logout redireciona para /login", async ({ page }) => {
  35 |     await page.goto("/login")
  36 |     await page.getByLabel(/e-mail/i).fill(process.env.E2E_ADMIN_EMAIL!)
  37 |     await page.getByLabel(/senha/i).fill(process.env.E2E_ADMIN_SENHA!)
  38 |     await page.getByRole("button", { name: /entrar/i }).click()
  39 |     await page.waitForURL("/")
  40 | 
  41 |     // Abre dropdown do avatar e clica em Sair
  42 |     await page.locator("header button[title]").click()
  43 |     await page.getByRole("button", { name: /sair/i }).click()
  44 | 
  45 |     await expect(page).toHaveURL(/\/login/)
  46 |   })
  47 | })
```
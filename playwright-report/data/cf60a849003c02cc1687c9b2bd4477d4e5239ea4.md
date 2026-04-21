# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cultos.spec.ts >> Cultos — Admin >> acessa tela de detalhe do culto
- Location: tests\e2e\cultos.spec.ts:35:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
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
  1  | // tests/e2e/helpers/auth.ts
  2  | import { type Page } from "@playwright/test"
  3  | 
  4  | export async function loginComoAdmin(page: Page) {
  5  |   await page.goto("/login")
> 6  |   await page.getByLabel(/e-mail/i).fill(process.env.E2E_ADMIN_EMAIL!)
     |                                    ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  7  |   await page.getByLabel(/senha/i).fill(process.env.E2E_ADMIN_SENHA!)
  8  |   await page.getByRole("button", { name: /entrar/i }).click()
  9  |   await page.waitForURL("/")
  10 | }
  11 | 
  12 | export async function loginComoCantor(page: Page) {
  13 |   await page.goto("/login")
  14 |   await page.getByLabel(/e-mail/i).fill(process.env.E2E_CANTOR_EMAIL!)
  15 |   await page.getByLabel(/senha/i).fill(process.env.E2E_CANTOR_SENHA!)
  16 |   await page.getByRole("button", { name: /entrar/i }).click()
  17 |   await page.waitForURL("/")
  18 | }
  19 | 
  20 | export async function loginComoMusico(page: Page) {
  21 |   await page.goto("/login")
  22 |   await page.getByLabel(/e-mail/i).fill(process.env.E2E_MUSICO_EMAIL!)
  23 |   await page.getByLabel(/senha/i).fill(process.env.E2E_MUSICO_SENHA!)
  24 |   await page.getByRole("button", { name: /entrar/i }).click()
  25 |   await page.waitForURL("/")
  26 | }
```
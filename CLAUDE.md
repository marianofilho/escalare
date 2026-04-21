# CLAUDE.md — Ministério de Louvor

Este arquivo instrui a IA sobre o contexto, stack, arquitetura e padrões de engenharia adotados neste projeto. Siga estas diretrizes em **todas** as gerações de código, sem exceção.

---

## 1. Contexto do Projeto

Sistema web de gestão de ministério de louvor de uma igreja evangélica. Funcionalidades principais:

- Cadastro de membros (músicos, cantores, backing vocal)
- Escala mensal de cultos com inscrição automática
- Catálogo de músicas com áudios e playbacks por cantor/tom (links Google Drive)
- Repertório do culto montado pelo cantor
- Player de material de estudo com controle de velocidade
- Multi-tenant: cada instância serve um ministério/igreja

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript (strict mode) |
| Estilização | Tailwind CSS |
| ORM | Prisma 6 |
| Banco de dados | PostgreSQL via Supabase |
| Autenticação | Supabase Auth |
| Hospedagem | Vercel |
| Gerenciador de pacotes | npm |

**Nunca** sugira migrar para Prisma 7 — a versão 6 é a adotada e estável no projeto.

---

## 3. Estrutura de Pastas

```
ministerio-louvor/
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   └── migrations/            # Migrations geradas pelo Prisma
├── src/
│   ├── app/
│   │   ├── (auth)/            # Rotas públicas: login, cadastro
│   │   ├── (dashboard)/       # Rotas protegidas: app principal
│   │   │   ├── membros/
│   │   │   ├── cultos/
│   │   │   ├── musicas/
│   │   │   └── repertorio/
│   │   └── api/               # API Routes do Next.js
│   │       ├── membros/
│   │       ├── cultos/
│   │       ├── musicas/
│   │       └── auth/
│   ├── components/
│   │   ├── ui/                # Componentes base (Button, Input, Card...)
│   │   └── [feature]/         # Componentes específicos por domínio
│   ├── lib/
│   │   ├── prisma.ts          # Singleton do Prisma Client
│   │   ├── supabase.ts        # Cliente Supabase (browser)
│   │   └── supabase-server.ts # Cliente Supabase (server)
│   ├── services/              # Lógica de negócio (camada de serviço)
│   ├── repositories/          # Acesso ao banco via Prisma (camada de dados)
│   ├── dtos/                  # Data Transfer Objects (entrada e saída da API)
│   ├── mappers/               # Conversão entre entidades e DTOs
│   ├── hooks/                 # React hooks customizados
│   ├── types/                 # Tipos e interfaces globais
│   └── utils/                 # Funções utilitárias puras
├── .env                       # Variáveis de ambiente (não commitar)
├── .env.example               # Exemplo de variáveis (commitar)
└── CLAUDE.md                  # Este arquivo
```

---

## 4. Arquitetura e Separação de Responsabilidades

O projeto segue arquitetura em camadas. **Nunca misture responsabilidades entre camadas.**

```
Request → API Route → Service → Repository → Prisma → Banco
                ↓
            DTO (entrada)
                ↓
           Validação
                ↓
          Lógica de negócio
                ↓
           DTO (saída)
                ↓
            Response
```

### 4.1 API Routes (`src/app/api/`)
- Responsabilidade: receber a request, chamar o service, retornar a response
- **Não** contém lógica de negócio
- **Não** acessa o banco diretamente
- Valida o DTO de entrada antes de passar ao service
- Retorna sempre um DTO de saída padronizado

```typescript
// ✅ correto
export async function POST(request: Request) {
  const body = await request.json()
  const dto = CriarMembroDto.parse(body) // valida com Zod
  const membro = await membroService.criar(dto)
  return NextResponse.json(MembroResponseDto.from(membro))
}

// ❌ errado — lógica de negócio na API route
export async function POST(request: Request) {
  const body = await request.json()
  const existe = await prisma.membro.findUnique({ where: { email: body.email } })
  if (existe) return NextResponse.json({ error: "já existe" }, { status: 409 })
  const membro = await prisma.membro.create({ data: body })
  return NextResponse.json(membro)
}
```

### 4.2 Services (`src/services/`)
- Responsabilidade: lógica de negócio, regras, validações de domínio
- **Não** acessa o banco diretamente — usa o repository
- **Não** conhece request/response HTTP
- Lança erros tipados de domínio (ex: `MembroJaExisteError`)

```typescript
// src/services/membro.service.ts
export class MembroService {
  constructor(private readonly membroRepository: MembroRepository) {}

  async criar(dto: CriarMembroDto): Promise<Membro> {
    const existe = await this.membroRepository.findByEmail(dto.email, dto.igrejaId)
    if (existe) throw new MembroJaExisteError(dto.email)
    return this.membroRepository.criar(dto)
  }
}
```

### 4.3 Repositories (`src/repositories/`)
- Responsabilidade: acesso ao banco via Prisma
- **Não** contém lógica de negócio
- Métodos nomeados de forma semântica: `findById`, `findByEmail`, `criar`, `atualizar`, `deletar`, `listarPorIgreja`

```typescript
// src/repositories/membro.repository.ts
export class MembroRepository {
  async findByEmail(email: string, igrejaId: string) {
    return prisma.membro.findUnique({
      where: { email_igrejaId: { email, igrejaId } },
    })
  }

  async criar(data: CriarMembroDto) {
    return prisma.membro.create({ data })
  }
}
```

---

## 5. DTOs e Validação

Use **Zod** para validação e tipagem dos DTOs. Instale se necessário: `npm install zod`

### 5.1 DTOs de entrada (request)
```typescript
// src/dtos/membro/criar-membro.dto.ts
import { z } from "zod"

export const CriarMembroSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
  telefone: z.string().optional(),
  perfil: z.enum(["ADMINISTRADOR", "CANTOR", "MUSICO", "BACKING_VOCAL"]),
  instrumentoPrincipal: z.string().optional(),
  instrumentoSecundario: z.string().optional(),
  fazBackingVocal: z.boolean().default(false),
  igrejaId: z.string().cuid(),
})

export type CriarMembroDto = z.infer<typeof CriarMembroSchema>
```

### 5.2 DTOs de saída (response)
```typescript
// src/dtos/membro/membro-response.dto.ts
export class MembroResponseDto {
  id: string
  nome: string
  email: string
  perfil: string
  instrumentoPrincipal: string | null
  fazBackingVocal: boolean
  status: string

  static from(membro: Membro): MembroResponseDto {
    return {
      id: membro.id,
      nome: membro.nome,
      email: membro.email,
      perfil: membro.perfil,
      instrumentoPrincipal: membro.instrumentoPrincipal,
      fazBackingVocal: membro.fazBackingVocal,
      status: membro.status,
    }
  }
}
```

**Nunca** retorne o objeto Prisma diretamente na response — sempre mapeie para um DTO de saída. Isso evita expor campos sensíveis (senhas, dados internos) e desacopla o contrato da API do schema do banco.

---

## 6. Padrões de Projeto Adotados

### Repository Pattern
Toda query ao banco passa pelo repository. A camada de serviço nunca importa o `prisma` diretamente.

### Service Layer
Toda lógica de negócio vive no service. A API route nunca toma decisões de domínio.

### DTO Pattern
Toda entrada e saída da API é tipada via DTO. Validação sempre com Zod.

### Mapper Pattern
Conversão entre entidade do banco e DTO feita em mappers dedicados, nunca inline.

### Singleton
O Prisma Client é um singleton global (já configurado em `src/lib/prisma.ts`).

### Error Handling centralizado
Erros de domínio são classes tipadas. A API route os captura e retorna o status HTTP correto.

```typescript
// src/types/errors.ts
export class MembroJaExisteError extends Error {
  constructor(email: string) {
    super(`Membro com e-mail ${email} já existe nesta igreja`)
    this.name = "MembroJaExisteError"
  }
}

export class NaoEncontradoError extends Error {
  constructor(entidade: string, id: string) {
    super(`${entidade} com id ${id} não encontrado`)
    this.name = "NaoEncontradoError"
  }
}
```

```typescript
// Na API route
try {
  const membro = await membroService.criar(dto)
  return NextResponse.json(MembroResponseDto.from(membro), { status: 201 })
} catch (error) {
  if (error instanceof MembroJaExisteError)
    return NextResponse.json({ error: error.message }, { status: 409 })
  if (error instanceof NaoEncontradoError)
    return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ error: "Erro interno" }, { status: 500 })
}
```

---

## 7. Regras de TypeScript

- `strict: true` sempre ativo no `tsconfig.json`
- **Nunca** use `any` — use `unknown` e faça narrowing
- Prefira `type` para unions e `interface` para objetos extensíveis
- Todos os parâmetros de função devem ser tipados explicitamente
- Retornos de função assíncrona devem ser `Promise<T>` explícito quando não inferível

---

## 8. Regras de Banco de Dados

- **Nunca** faça queries dentro de loops — use `findMany` com `where: { id: { in: ids } }`
- Sempre filtre por `igrejaId` em todas as queries — isolamento multi-tenant obrigatório
- Use transações Prisma (`prisma.$transaction`) quando múltiplas operações precisam ser atômicas
- Nomes de tabelas e campos seguem o schema Prisma definido — não renomeie sem migration

```typescript
// ✅ correto — sempre filtra por igrejaId
const membros = await prisma.membro.findMany({
  where: { igrejaId, status: "ATIVO" },
})

// ❌ errado — sem isolamento de tenant
const membros = await prisma.membro.findMany()
```

---

## 9. Regras de Componentes React

- Componentes de página ficam em `src/app/`
- Componentes reutilizáveis ficam em `src/components/`
- Prefira Server Components — use `"use client"` só quando necessário (interatividade, hooks)
- Props sempre tipadas com `interface` ou `type`
- Nenhum componente acessa o banco diretamente — dados vêm via fetch da API ou Server Actions

---

## 10. Regras de Segurança

- Toda rota da API verifica a sessão do Supabase Auth antes de processar
- Toda query filtra por `igrejaId` extraído da sessão — nunca do body da request
- Nunca exponha `DIRECT_URL`, chaves privadas do Supabase ou secrets no frontend
- Variáveis de ambiente públicas (acessíveis no browser) devem ter prefixo `NEXT_PUBLIC_`
- Dados sensíveis (tokens, senhas) nunca aparecem nos DTOs de resposta

```typescript
// ✅ igrejaId vem da sessão autenticada, nunca do body
export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const membros = await membroService.listar(session.user.igrejaId)
  return NextResponse.json(membros.map(MembroResponseDto.from))
}
```

---

## 11. Links de Referência

- Documentação Next.js App Router: https://nextjs.org/docs
- Documentação Prisma 6: https://www.prisma.io/docs
- Documentação Supabase Auth: https://supabase.com/docs/guides/auth
- Documentação Zod: https://zod.dev
- Schema do banco: `prisma/schema.prisma`
- Protótipos aprovados: ver documento de requisitos v4.0

---

## 12. O que NUNCA fazer

- Nunca use `prisma` diretamente em componentes React ou API routes — sempre via repository
- Nunca retorne objetos Prisma crus na API — sempre mapeie para DTO
- Nunca coloque lógica de negócio na API route — sempre no service
- Nunca faça query sem filtrar `igrejaId`
- Nunca atualize para Prisma 7 sem revisar o guia de migração com o time
- Nunca use `any` no TypeScript
- Nunca commite o arquivo `.env` — use `.env.example` como referência

## 13. Backlog de Melhorias

### Alta prioridade
- [x] **Dashboard com dados reais** — validar se `DashboardClient` está consumindo dados reais do banco (`totalMembros`, `totalMusicas`, `proximosCultos`) ou valores hardcoded
- [x] **Tela de culto individual** (`/cultos/[id]`) — view detalhada com inscritos, link para repertório e status do culto; o `CultoLista` já linka para `/cultos/[id]/editar` mas a view de leitura não existe
- [ ] **Testes** Criar testes para cada funcionalidade, fazer uma boa cobertura de testes no sistema;

### Média prioridade
- [x] **Marcação de ausência** — o schema tem `ausente` em `InscricaoCulto` e o `CultoService` tem `marcarAusente`, mas não há UI; admin marca quem faltou após o culto
- [x] **Restaurar música arquivada** — adicionar ação "Restaurar" na listagem de músicas arquivadas (status `ARQUIVADA` → `ATIVA`)
- [x] **Perfil do membro** (`/perfil`) — página onde o próprio membro atualiza nome, telefone, instrumento principal e foto de perfil
- [ ] **Notificação de escala por email** — ao criar ou editar um culto, notificar membros por email que as inscrições estão abertas (Supabase já tem suporte a envio de emails)

### Baixa prioridade
- [x] **`.env.example`** — criar arquivo com todas as variáveis necessárias documentadas (previsto no CLAUDE.md mas não gerado)
- [x] **Validar middleware de rotas** (`proxy.ts`) — garantir que todas as rotas do `(dashboard)` redirecionam para `/login` sem sessão ativa, sem depender da verificação individual em cada page
- [x] **Filtro de músicas por cantor** — na tela de músicas, cantor vê apenas as músicas onde está vinculado, sem navegar por todo o catálogo
- [x] **Histórico de repertórios** — na tela `/repertorio`, além dos próximos cultos, exibir os cultos já realizados com seus repertórios para consulta

## 14. Sugestões de Melhoria

### Alta prioridade

- [ ] **Notificação de escala por email** — ao criar ou editar um culto, notificar membros por email que as inscrições estão abertas. O projeto já tem Resend configurado (`RESEND_FROM_EMAIL`). Supabase também tem suporte nativo a envio de emails via `supabase.auth.admin.sendRawEmail()`. Fluxo sugerido: `CultoService.criar()` → dispara email para todos os membros ativos da igreja com link direto para `/cultos/[id]`

- [ ] **Testes** — criar testes para cada funcionalidade com boa cobertura. Stack sugerida: **Vitest** para unit tests (services e repositories) e **Playwright** para testes E2E das principais jornadas (inscrição em culto, solicitação de vínculo, montagem de repertório). Priorizar testes nos services pois concentram a lógica de negócio

### Média prioridade

- [ ] **Paginação** — músicas, membros e cultos carregam todos os registros de uma vez. Em ministérios maiores isso vai degradar a performance. Implementar paginação com cursor no repository (`findMany` com `cursor` e `take`) e componente `<Paginacao>` reutilizável nos listagens

- [ ] **Busca global** — barra de busca no header que pesquisa simultaneamente em membros, músicas e cultos, retornando resultados agrupados por categoria. Pode ser implementada como `GET /api/busca?q=termo` com queries paralelas via `prisma.$transaction`

- [ ] **Tela de membro individual** (`/membros/[id]`) — view de leitura com histórico de cultos em que participou, músicas vinculadas (se for cantor), instrumentos e dados de contato. Útil para o admin consultar rapidamente o histórico de um membro

### Baixa prioridade

- [ ] **PWA (Progressive Web App)** — configurar o Next.js como PWA para que músicos possam instalar o app no celular e acessar o repertório offline durante o culto. Requer `next-pwa` e um `service-worker` que faça cache dos repertórios recentes

- [ ] **Dark mode** — adicionar suporte a tema escuro via `prefers-color-scheme` e toggle manual. O Tailwind já suporta via classe `dark:`. Útil para uso do app em ambientes com pouca luz (palco, ensaio noturno)

- [ ] **Exportar repertório em PDF** — cantor ou admin exporta o repertório de um culto como PDF para impressão ou compartilhamento offline. Pode usar `@react-pdf/renderer` ou geração via API com `puppeteer`

- [ ] **Log de atividades** — registrar ações críticas (criação de culto, aprovação de vínculo, alteração de perfil) em uma tabela `LogAtividade` para auditoria pelo admin

- [ ] **Recuperar senha** — registrar ações críticas (criação de culto, aprovação de vínculo, alteração de perfil) em uma tabela `LogAtividade` para auditoria pelo admin

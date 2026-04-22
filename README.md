# Escalare 🎵

> Gestão Inteligente de Escalas, Músicas e Repertório de Louvor.

O **Escalare** é uma solução Full Stack moderna desenvolvida para organizar o fluxo de trabalho de ministérios de música. Utilizando o que há de mais recente no ecossistema JavaScript, o sistema oferece uma experiência ágil para gestores e músicos.

## 🚀 Funcionalidades

## 1. Contexto do Projeto

Sistema web de gestão de ministério de louvor de uma igreja. Funcionalidades principais:

- Cadastro de membros (músicos, cantores, backing vocal)
- Escala mensal de cultos com inscrição automática
- Catálogo de músicas com áudios e playbacks por cantor/tom (links Google Drive)
- Repertório do culto montado pelo cantor
- Player de material de estudo

- **Testes de Confiabilidade:** Garantia de funcionamento via testes unitários e de integração.

## 🛠️ Stack Tecnológica

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **Testes:** [Vitest](https://vitest.dev/)
- **Estilização:** Tailwind CSS

## 💻 Instalação e Setup

```bash
# 1. Clone o repositório
git clone [https://github.com/marianofilho/escalare.git](https://github.com/marianofilho/escalare.git)

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (.env)
# Certifique-se de configurar a DATABASE_URL do PostgreSQL
cp .env.example .env

# 4. Execute as migrações do Prisma
npx prisma migrate dev

# 5. Inicie o servidor de desenvolvimento
npm run dev
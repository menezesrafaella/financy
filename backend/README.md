# Financy — Backend

API em Node.js para gestão de finanças pessoais: autenticação (JWT), categorias, transações, resumo e GraphQL.

## Stack

- **Node.js** + **Express**
- **TypeScript**
- **GraphQL** ([GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)) em `POST /graphql` (GraphiQL em desenvolvimento)
- **Prisma** + **SQLite**
- **bcryptjs** (senha), **jsonwebtoken** (JWT), **Zod** (validação nas rotas REST), **CORS**

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma    # Modelos User, Category, Transaction
│   ├── seed.ts          # Usuário demo + categorias + transações
│   └── migrations/
├── src/
│   ├── app.ts           # Express, CORS, Yoga em /graphql
│   ├── server.ts
│   ├── graphql/         # Schema e resolvers GraphQL
│   ├── routes/          # REST em /api (ex.: categorias)
│   ├── middleware/
│   └── config/
└── env.example          # Modelo de variáveis de ambiente
```

## Pré-requisitos

- Node.js 18+ (recomendado)
- npm

## Variáveis de ambiente

Copie o exemplo e ajuste:

```bash
cp env.example .env
```

| Variável       | Descrição                                      |
|----------------|------------------------------------------------|
| `JWT_SECRET`   | Chave para assinatura do JWT                   |
| `DATABASE_URL` | URL do SQLite (ex.: `file:./dev.db`)           |
| `PORT`         | Porta da API (padrão `3333`)                   |
| `CLIENT_URL`   | Origem permitida no CORS (ex.: Vite `5173`)  |

## Scripts

| Comando              | Descrição                          |
|----------------------|------------------------------------|
| `npm run dev`        | Servidor com hot reload            |
| `npm run build`      | Compila TypeScript para `dist/`    |
| `npm start`          | Roda `dist/server.js`              |
| `npm run prisma:generate` | Gera o client Prisma          |
| `npm run prisma:migrate`  | Aplica migrações (dev)        |
| `npm run prisma:seed`     | Executa o seed                |

## Como rodar (desenvolvimento)

```bash
cd backend
npm install
cp env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed   # opcional — dados de demonstração
npm run dev
```

- API: `http://localhost:3333`
- GraphQL: `http://localhost:3333/graphql`

## Autenticação

- **Login / registro** via mutations GraphQL retornam `token`.
- Envie o token nas requisições: cabeçalho `Authorization: Bearer <token>`.
- Dados de **categorias** e **transações** são sempre filtrados pelo usuário autenticado.

## Usuário de demonstração (seed)

| Campo  | Valor                 |
|--------|------------------------|
| E-mail | `test@financy.app`     |
| Senha  | `password1234`          |

## Checklist (requisitos do desafio — backend)

- [ ] O usuário pode criar uma conta e fazer login
- [ ] O usuário pode ver e gerenciar apenas as transações e categorias criadas por ele
- [ ] CRUD de transações e listagem
- [ ] CRUD de categorias e listagem
- [ ] GraphQL + Prisma + SQLite configurados
- [ ] Arquivo de exemplo de variáveis de ambiente (`env.example`)

## Documentação adicional

- Visão geral do monorepo e como subir front + back: [README na raiz do projeto](../README.md).

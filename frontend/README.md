# Financy — Frontend

Aplicação **React** (Vite + TypeScript) para o painel Financy: login, dashboard, transações, categorias e perfil. Consome a API via **GraphQL**.

## Stack

- **React 18**
- **Vite 5** (bundler, sem framework full-stack)
- **TypeScript**
- **React Router** (rotas e layout autenticado)
- **GraphQL** via `fetch` (sem Apollo/React Query obrigatório)
- CSS global (`src/styles.css`)

## Estrutura

```
frontend/
├── public/              # Assets estáticos (ícones, logo)
├── src/
│   ├── api/client.ts    # Cliente GraphQL + token
│   ├── components/      # Layout, RootLayout
│   ├── contexts/        # AuthContext
│   ├── pages/           # Login, Register, Dashboard, Transactions, Categories, Profile
│   ├── utils/           # Helpers visuais de categoria
│   ├── App.tsx
│   └── main.tsx
├── index.html
└── .env.example
```

## Pré-requisitos

- Node.js 18+ (recomendado)
- npm
- Backend em execução (veja [backend/README.md](../backend/README.md))

## Variáveis de ambiente

```bash
cp .env.example .env
```

| Variável            | Descrição                                      |
|---------------------|------------------------------------------------|
| `VITE_BACKEND_URL`  | URL do endpoint GraphQL (ex.: `http://localhost:3333/graphql`) |

## Scripts

| Comando           | Descrição                    |
|-------------------|------------------------------|
| `npm run dev`     | Servidor de desenvolvimento  |
| `npm run build`   | Typecheck + build de produção |
| `npm run preview` | Preview do build             |

## Como rodar (desenvolvimento)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abra `http://localhost:5173`. Garanta que o `VITE_BACKEND_URL` aponte para o mesmo host/porta do backend e que o `CLIENT_URL` no backend inclua a origem do Vite (CORS).

## Fluxo da aplicação

- **Deslogado:** `/` e `/login` exibem a tela de login; `/register` para cadastro.
- **Logado:** layout com navegação (Dashboard, Transações, Categorias) e avatar → Perfil.
- Modais para criar/editar **categoria** e **transação**; logout no perfil.

## Checklist (requisitos do desafio — frontend)

- [ ] O usuário pode criar uma conta e fazer login
- [ ] O usuário pode ver e gerenciar apenas os dados retornados pela API (escopo do usuário)
- [ ] CRUD de transações e listagem
- [ ] CRUD de categorias e listagem
- [ ] React com GraphQL e Vite configurados
- [ ] Arquivo de exemplo de variáveis (`.env.example`)

## Layout

O desafio pede aderência ao **Figma** do Financy; tokens de cor, tipografia (Inter) e componentes estão em `styles.css` e nas páginas.

## Documentação adicional

- Visão geral do monorepo: [README na raiz do projeto](../README.md).

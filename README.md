# 💸 Financy

> **Projeto fullstack de gestão financeira (Módulo 3)**
> 
> Uma aplicação moderna construída para o controle de finanças pessoais, com foco em performance e uma arquitetura baseada em GraphQL. O layout da interface segue estritamente o modelo indicado no desafio.

---

## 🚀 Visão Geral da Stack

A aplicação foi separada em dois ecossistemas principais para garantir a escalabilidade:

| Camada    | Tecnologias Principais                                       |
| :---      | :---                                                         |
| **Backend** | Node.js, Express, GraphQL Yoga, Prisma ORM e SQLite          |
| **Frontend** | React, Vite, TypeScript, React Router e Integração com GraphQL |

## 📂 Estrutura do Repositório

O projeto segue a estrutura de monorepo, separando as responsabilidades em pastas dedicadas:

```text
module-03/
├── backend/          # API + Banco de Dados (Prisma) + GraphQL
├── frontend/         # Aplicação Web (SPA) em React + Vite
└── README.md         # Documentação central (Este arquivo)

🛠️ Como executar o projeto localmente
Siga o passo a passo abaixo para rodar a aplicação na sua máquina.

1. Inicializando o Backend
Abra o terminal, navegue até a pasta do backend e configure a API e o banco de dados:

# Entre na pasta do backend
cd backend

# Instale as dependências do projeto
npm install

# Crie o seu arquivo de variáveis de ambiente com base no exemplo
cp env.example .env

# Gere o client do Prisma e rode as migrations para criar o banco de dados
npm run prisma:generate
npm run prisma:migrate

# Popule o banco com dados iniciais de teste (Seed)
npm run prisma:seed

# Inicie o servidor de desenvolvimento
npm run dev


📍 Serviços ativos:

API REST: http://localhost:3333

Playground GraphQL: http://localhost:3333/graphql (Consultas e Mutations)

2. Inicializando o Frontend
Abra uma nova aba no terminal e configure a interface:

Bash
# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Crie o seu arquivo de variáveis de ambiente
cp .env.example .env

# Inicie a aplicação web
npm run dev


📍 Aplicação rodando em: http://localhost:5173

⚠️ Atenção às Variáveis de Ambiente: > Certifique-se de que o CLIENT_URL no .env do backend aponte para a origem do frontend (ex: http://localhost:5173). Da mesma forma, o VITE_BACKEND_URL no frontend deve apontar para a URL da sua API GraphQL (ex: http://localhost:3333/graphql).

🔑 Credenciais de Demonstração
Após rodar o comando npm run prisma:seed no backend, um usuário padrão será criado. Você pode usá-lo para testar a aplicação imediatamente:

E-mail: test@financy.app
Senha: password1234

Cada módulo possui sua própria documentação contendo detalhes específicos da arquitetura, scripts, configurações extras e checklists do desafio
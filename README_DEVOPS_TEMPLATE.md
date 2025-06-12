# DevOps Project - CRUD API

[![Build Status](https://dev.azure.com/pucpr-estudantes/DevOps/_apis/build/status/DevOps-CI?branchName=main)](https://dev.azure.com/pucpr-estudantes/DevOps/_build/latest?definitionId=X&branchName=main)
[![Azure App Service](https://img.shields.io/badge/Azure-App%20Service-blue)](https://your-app.azurewebsites.net)

## 📊 **Visão Geral**

Este projeto implementa uma API CRUD completa usando NestJS e TypeScript, desenvolvida para demonstrar práticas modernas de DevOps com integração contínua (CI) e entrega contínua (CD) usando Azure DevOps.

### 🎯 **Objetivos do Projeto**

- Implementar práticas DevOps com versionamento usando GitFlow
- Configurar pipeline CI/CD automatizada
- Deploy automatizado no Azure App Service
- Demonstrar boas práticas de desenvolvimento em equipe

## 🚀 **Tecnologias Utilizadas**

- **Framework**: NestJS 10.x + TypeScript
- **Banco de Dados**: MongoDB Atlas
- **Documentação**: Swagger/OpenAPI
- **Deploy**: Azure App Service
- **CI/CD**: Azure Pipelines
- **Versionamento**: Git com GitFlow
- **Autenticação**: JWT (JSON Web Token)

## 🏗️ **Arquitetura da API**

### Entidades Principais

- **Users** - Gerenciamento de usuários
- **Projects** - Gerenciamento de projetos
- **Tasks** - Gerenciamento de tarefas

### Estrutura do Projeto

```
src/
├── modules/
│   ├── users/           # Módulo de usuários
│   ├── projects/        # Módulo de projetos
│   ├── tasks/           # Módulo de tarefas
│   └── auth/            # Módulo de autenticação
├── shared/              # Utilitários compartilhados
├── config/              # Configurações da aplicação
└── main.ts              # Ponto de entrada
```

## 🛠️ **Instalação e Configuração Local**

### Pré-requisitos

- Node.js 18+
- MongoDB (local ou Atlas)
- Git

### Passos para Instalação

```bash
# 1. Clonar o repositório
git clone https://dev.azure.com/pucpr-estudantes/DevOps/_git/DevOps
cd DevOps

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# 4. Executar em modo desenvolvimento
npm run start:dev
```

### Configuração do .env

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/devops
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```

## 📚 **Endpoints da API**

### Usuários

- `GET /api/users` - Listar todos os usuários
- `GET /api/users/:id` - Buscar usuário por ID
- `POST /api/users` - Criar novo usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Projetos

- `GET /api/projects` - Listar todos os projetos
- `GET /api/projects/:id` - Buscar projeto por ID
- `POST /api/projects` - Criar novo projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto

### Tarefas

- `GET /api/tasks` - Listar todas as tarefas
- `GET /api/tasks/:id` - Buscar tarefa por ID
- `POST /api/tasks` - Criar nova tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Deletar tarefa

## 🌐 **Documentação Swagger**

A documentação completa da API está disponível em:

- **Local**: http://localhost:3000/api
- **Produção**: https://your-app.azurewebsites.net/api

## 🔄 **Workflow GitFlow**

### Estrutura de Branches

- **main** - Branch de produção (protegida)
- **develop** - Branch de desenvolvimento principal
- **release** - Branch de preparação para release
- **feature/[nome]** - Branches individuais para features

### Regras de Branch

- ❌ Commits diretos na `main` não são permitidos
- ✅ Pull Requests obrigatórios com aprovação de pelo menos 1 reviewer
- ✅ Testes automáticos devem passar antes do merge
- ✅ Build deve ser bem-sucedida

## 🚀 **Pipeline CI/CD**

### Stages da Pipeline

1. **Build** - Instalação de dependências e build da aplicação
2. **Test** - Execução de testes unitários e de integração
3. **Deploy** - Deploy automático no Azure App Service

### Triggers

- Push em `main`, `develop`, `release`
- Pull requests para `main`

## ☁️ **Deploy e Infraestrutura**

### Azure App Service

- **URL de Produção**: https://your-app.azurewebsites.net
- **Runtime**: Node.js 18 LTS
- **Plano**: Basic B1

### MongoDB Atlas

- **Cluster**: DevOps-Cluster
- **Região**: East US
- **Tier**: M0 (Free)

## 👥 **Equipe de Desenvolvimento**

| Nome     | Branch Individual      | Responsabilidade   |
| -------- | ---------------------- | ------------------ |
| [Nome 1] | `[nome1]/user-crud`    | Módulo de Usuários |
| [Nome 2] | `[nome2]/project-crud` | Módulo de Projetos |
| [Nome 3] | `[nome3]/task-crud`    | Módulo de Tarefas  |

## 🧪 **Testes**

```bash
# Executar todos os testes
npm run test

# Testes com coverage
npm run test:cov

# Testes de integração
npm run test:e2e

# Testes em modo watch
npm run test:watch
```

## 📊 **Comandos Úteis**

```bash
# Desenvolvimento
npm run start:dev          # Modo desenvolvimento com hot reload
npm run start:debug        # Modo debug

# Build
npm run build              # Build para produção
npm run start:prod         # Executar build de produção

# Linting e Formatação
npm run lint               # Verificar código
npm run lint:fix           # Corrigir automaticamente
npm run format             # Formatar código

# Docker (opcional)
docker-compose up -d       # Subir MongoDB local
```

## 🐛 **Resolução de Problemas**

### Build Falha

1. Verificar se todas as dependências estão instaladas
2. Verificar se não há erros de TypeScript
3. Verificar logs da pipeline no Azure DevOps

### Testes Falham

1. Verificar se MongoDB está rodando
2. Verificar variáveis de ambiente de teste
3. Verificar se não há conflitos de porta

### Deploy Falha

1. Verificar Service Connection do Azure
2. Verificar configurações do App Service
3. Verificar variáveis de ambiente no Azure

## 📝 **Contribuição**

1. Criar branch a partir de `develop`
2. Implementar feature/bugfix
3. Executar testes localmente
4. Criar Pull Request para `develop`
5. Aguardar aprovação e merge

## 📄 **Licença**

Este projeto é desenvolvido para fins acadêmicos - PUCPR BSI 2024.

---

## 🔗 **Links Úteis**

- [Azure DevOps Project](https://dev.azure.com/pucpr-estudantes/DevOps)
- [App Service](https://your-app.azurewebsites.net)
- [Swagger Documentation](https://your-app.azurewebsites.net/api)
- [MongoDB Atlas](https://cloud.mongodb.com)

---

**Status do Projeto**: 🟢 Ativo | **Última Atualização**: [Data] | **Versão**: 1.0.0

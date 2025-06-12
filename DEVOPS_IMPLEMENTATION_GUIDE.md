# DevOps Implementation Guide

## Objetivo: Implementar práticas DevOps com CI/CD no Azure DevOps

### 📋 **Pré-requisitos**

- [ ] Conta no Azure DevOps
- [ ] Node.js 18+ instalado
- [ ] Git configurado
- [ ] Acesso ao Azure Portal (para App Service)

---

## 🗂️ **ETAPA 1: Criação do Repositório Azure DevOps**

### 1.1 Criar o Repositório

1. Acesse [Azure DevOps](https://dev.azure.com)
2. Crie um novo projeto chamado **"DevOps"**
3. Inicialize o repositório Git

### 1.2 Clonar e Configurar Localmente

```bash
# Clonar o repositório
git clone https://dev.azure.com/[sua-org]/DevOps/_git/DevOps
cd DevOps

# Configurar credenciais (use PAT)
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"
```

---

## 🏗️ **ETAPA 2: Preparar a API CRUD**

### 2.1 Copiar o Sistema Base

```bash
# Copiar arquivos do measura-backend para o novo repositório
cp -r ../measura-backend/* ./
```

### 2.2 Simplificar para CRUD Básico

Vamos criar uma API CRUD simples com as seguintes entidades:

- **Users** (Usuários)
- **Projects** (Projetos)
- **Tasks** (Tarefas)

### 2.3 Estrutura do Projeto

```
DevOps/
├── src/
│   ├── modules/
│   │   ├── users/
│   │   ├── projects/
│   │   └── tasks/
│   ├── app.module.ts
│   └── main.ts
├── test/
├── package.json
├── azure-pipelines.yml
├── README.md
└── .env.example
```

---

## 🌿 **ETAPA 3: Configurar Gitflow**

### 3.1 Criar as Branches Base

```bash
# Criar e configurar develop
git checkout -b develop
git push -u origin develop

# Criar e configurar release
git checkout -b release
git push -u origin release

# Voltar para main
git checkout main
```

### 3.2 Replicar Código Base

```bash
# Adicionar código inicial em todas as branches
git checkout develop
# Fazer commit do código base
git add .
git commit -m "feat: initial API CRUD setup"
git push origin develop

# Replicar para release
git checkout release
git merge develop
git push origin release

# Replicar para main
git checkout main
git merge release
git push origin main
```

---

## 🔒 **ETAPA 4: Configurar Políticas de Branch**

### 4.1 Configurar Políticas no Azure DevOps

1. Vá para **Repos** → **Branches**
2. Clique nos três pontos da branch **main** → **Branch policies**
3. Configure:
   - ✅ **Require a minimum number of reviewers**: 1
   - ✅ **Check for linked work items**: Opcional
   - ✅ **Check for comment resolution**: Recomendado
   - ✅ **Limit merge types**: Squash merge

### 4.2 Proteger Branch Main

- ❌ **Allow direct pushes**: Desabilitado
- ✅ **Require pull request**: Habilitado
- ✅ **Require approval**: Mínimo 1 aprovação

---

## 📝 **ETAPA 5: Criar README.md**

### 5.1 Template do README

````markdown
# DevOps Project - CRUD API

## 📊 **Visão Geral**

API CRUD desenvolvida para demonstrar práticas DevOps com CI/CD.

## 🚀 **Tecnologias**

- **Framework**: NestJS + TypeScript
- **Banco de Dados**: MongoDB
- **Documentação**: Swagger
- **Deploy**: Azure App Service
- **CI/CD**: Azure Pipelines

## 🛠️ **Instalação Local**

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar em desenvolvimento
npm run start:dev
```
````

## 📚 **API Endpoints**

- **GET** `/api/users` - Listar usuários
- **POST** `/api/users` - Criar usuário
- **PUT** `/api/users/:id` - Atualizar usuário
- **DELETE** `/api/users/:id` - Deletar usuário

## 🌐 **Swagger Documentation**

Acesse: `http://localhost:3000/api`

## 👥 **Equipe**

- [Nome 1] - [GitHub/Email]
- [Nome 2] - [GitHub/Email]
- [Nome 3] - [GitHub/Email]

## 🔄 **Workflow GitFlow**

- **main**: Produção
- **develop**: Desenvolvimento
- **release**: Preparação para release
- **feature/[nome]**: Features individuais

````

---

## ⚙️ **ETAPA 6: Criar azure-pipelines.yml**

### 6.1 Pipeline Completa
```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop
      - release

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'

stages:
  - stage: Build
    displayName: 'Build Stage'
    jobs:
      - job: BuildJob
        displayName: 'Build Application'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(nodeVersion)'
            displayName: 'Install Node.js'

          - script: |
              npm install
              npm run build
            displayName: 'Install dependencies and build'

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: 'dist'
              artifactName: 'dist'
            displayName: 'Publish build artifacts'

  - stage: Test
    displayName: 'Test Stage'
    dependsOn: Build
    jobs:
      - job: TestJob
        displayName: 'Run Tests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(nodeVersion)'
            displayName: 'Install Node.js'

          - script: |
              npm install
              npm run test
              npm run test:e2e
            displayName: 'Run unit and integration tests'

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/test-results.xml'
            displayName: 'Publish test results'

  - stage: Deploy
    displayName: 'Deploy Stage'
    dependsOn: Test
    condition: and(succeeded(), in(variables['Build.SourceBranch'], 'refs/heads/main', 'refs/heads/develop', 'refs/heads/release'))
    jobs:
      - deployment: DeployJob
        displayName: 'Deploy to Azure App Service'
        environment: 'Production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@0
                  inputs:
                    artifactName: 'dist'
                  displayName: 'Download build artifacts'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Service-Connection'
                    appType: 'webAppLinux'
                    appName: 'devops-crud-api'
                    package: '$(System.ArtifactsDirectory)/dist'
                    runtimeStack: 'NODE|18-lts'
                  displayName: 'Deploy to Azure App Service'
````

---

## ☁️ **ETAPA 7: Configurar Azure App Service**

### 7.1 Criar App Service

```bash
# Via Azure CLI
az webapp create \
  --resource-group "DevOps-RG" \
  --plan "DevOps-Plan" \
  --name "devops-crud-api" \
  --runtime "NODE|18-lts"
```

### 7.2 Configurar MongoDB Atlas

1. Crie conta no [MongoDB Atlas](https://cloud.mongodb.com)
2. Crie cluster e database
3. Configure connection string no App Service

### 7.3 Variáveis de Ambiente no App Service

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/devops
JWT_SECRET=your-secret-key
PORT=8080
```

---

## 👤 **ETAPA 8: Criar Branches Individuais**

### 8.1 Padrão de Nomenclatura

```bash
# Para cada membro da equipe
git checkout develop
git checkout -b joao/user-crud
git push -u origin joao/user-crud

git checkout develop
git checkout -b maria/project-crud
git push -u origin maria/project-crud

git checkout develop
git checkout -b pedro/task-crud
git push -u origin pedro/task-crud
```

---

## 🧪 **ETAPA 9: Preparação para Avaliação**

### 9.1 Cenários para Demonstração

#### A) Commit que Quebra a Build

```typescript
// Exemplo: remover import obrigatório
// src/main.ts
import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module'; // ❌ Comentar esta linha

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // ❌ Erro: AppModule não definido
  await app.listen(3000);
}
bootstrap();
```

#### B) Commit que Corrige a Build

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // ✅ Descomentar esta linha

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

### 9.2 Fluxo de Pull Requests

```bash
# 1. Develop → Release
git checkout release
git pull origin release
# Criar PR no Azure DevOps: develop → release

# 2. Release → Main
git checkout main
git pull origin main
# Criar PR no Azure DevOps: release → main
```

---

## ✅ **CHECKLIST FINAL**

### Repositório e Código

- [ ] Repositório "DevOps" criado no Azure DevOps
- [ ] API CRUD implementada (Users, Projects, Tasks)
- [ ] Swagger documentação funcionando
- [ ] Testes unitários implementados

### GitFlow e Branches

- [ ] Branches main, develop, release criadas
- [ ] Código replicado em todas as branches
- [ ] Branches individuais criadas (usuario/tarefa)

### Políticas e Segurança

- [ ] Branch main protegida (sem commits diretos)
- [ ] Pull requests com aprovação obrigatória
- [ ] Políticas de branch configuradas

### CI/CD Pipeline

- [ ] azure-pipelines.yml criado
- [ ] Stage Build funcionando
- [ ] Stage Test funcionando
- [ ] Stage Deploy funcionando

### Deploy e Infraestrutura

- [ ] Azure App Service configurado
- [ ] MongoDB Atlas configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy automático funcionando

### Documentação

- [ ] README.md completo
- [ ] Este guia de implementação

---

## 🚀 **Comandos Rápidos**

```bash
# Setup inicial
git clone https://dev.azure.com/[org]/DevOps/_git/DevOps
cd DevOps
npm install

# Desenvolvimento
npm run start:dev

# Testes
npm run test
npm run test:e2e

# Build
npm run build

# Deploy manual (se necessário)
npm run start:prod
```

---

## 📞 **Suporte**

Para dúvidas sobre implementação:

1. Consulte a documentação do Azure DevOps
2. Verifique logs da pipeline
3. Teste localmente antes de fazer push
4. Use o Swagger para testar endpoints

**Boa sorte na implementação! 🎯**

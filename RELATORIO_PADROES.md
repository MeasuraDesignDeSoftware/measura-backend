# Relatório de Padrões de Projeto GoF - RA2
## Projeto: Measura Backend - Sistema de Análise de Pontos de Função

**Data:** 15 de Outubro de 2025
**Equipe:** João Victor Ferreira e Lohine Mussi
**Disciplina:** Design de Software

---

## Sumário Executivo

Este relatório documenta a aplicação de **6 padrões de projeto** do catálogo Gang of Four (GoF) no backend do sistema Measura, uma aplicação NestJS para análise de pontos de função (FPA). A implementação atende aos requisitos da avaliação somativa RA2, que exige a aplicação de **no mínimo 4 padrões de projeto**.

### Padrões Implementados

| # | Padrão | Classificação GoF | Escopo | Arquivos Principais |
|---|--------|-------------------|--------|---------------------|
| 1 | Factory Method | Criacional | Classe | [report.factory.ts](src/domain/fpa/factories/report.factory.ts) |
| 2 | Builder | Criacional | Objeto | [estimate.builder.ts](src/domain/fpa/builders/estimate.builder.ts) |
| 3 | Decorator | Estrutural | Objeto | [repository-logger.decorator.ts](src/infrastructure/decorators/repository-logger.decorator.ts) |
| 4 | Chain of Responsibility | Comportamental | Objeto | [fpa-validation-chain.ts](src/domain/fpa/validators/fpa-validation-chain.ts) |
| 5 | Observer | Comportamental | Objeto | [estimate-subject.ts](src/domain/fpa/observers/estimate-subject.ts) |
| 6 | Singleton | Criacional | Objeto | [complexity-calculator.service.ts](src/domain/fpa/services/complexity-calculator.service.ts) |

---

## 1. Factory Method (Método Fábrica)

### Classificação GoF
- **Tipo:** Padrão Criacional
- **Escopo:** Classe
- **Intenção:** Definir uma interface para criar objetos, mas deixar as subclasses decidirem qual classe instanciar.

### Localização no Código

**Arquivos Criados:**
- `src/domain/fpa/factories/report.factory.ts` - Fábrica abstrata
- `src/domain/fpa/factories/pdf-report.factory.ts` - Fábrica concreta para PDF
- `src/domain/fpa/factories/csv-report.factory.ts` - Fábrica concreta para CSV
- `src/domain/fpa/factories/json-report.factory.ts` - Fábrica concreta para JSON

**Classes Envolvidas:**
- **Creator Abstrato:** `ReportFactory`
- **Creators Concretos:** `PDFReportFactory`, `CSVReportFactory`, `JSONReportFactory`
- **Product Interface:** `IReport`
- **Products Concretos:** `PDFReport`, `CSVReport`, `JSONReport`

### Justificativa de Aplicação

O sistema Measura precisa gerar relatórios de estimativas de pontos de função em múltiplos formatos (PDF, DOCX, CSV, JSON). Cada formato possui lógica de criação específica:

- **PDF:** Requer Puppeteer para renderização HTML → PDF
- **CSV:** Necessita formatação tabular e escape de caracteres especiais
- **JSON:** Estruturação hierárquica de dados

**Problemas Resolvidos:**
1. **Acoplamento:** Sem o padrão, o código cliente precisaria conhecer detalhes de implementação de cada formato
2. **Extensibilidade:** Adicionar novos formatos (Excel, XML) exigiria modificação do código existente
3. **Manutenção:** Lógica de criação espalhada dificulta manutenção

**Benefícios Obtidos:**
- Código cliente desacoplado da criação de relatórios
- Fácil adição de novos formatos (princípio Open/Closed)
- Cada fábrica encapsula a complexidade de seu formato
- Interface comum facilita uso polimórfico

### Exemplo de Uso

```typescript
// src/application/fpa/use-cases/estimate-with-patterns.service.ts:75

async generateReport(estimate: Estimate, format: 'pdf' | 'csv' | 'json') {
  let factory;

  // Factory Method: Seleção da fábrica apropriada
  switch (format) {
    case 'pdf':
      factory = new PDFReportFactory();
      break;
    case 'csv':
      factory = new CSVReportFactory();
      break;
    case 'json':
      factory = new JSONReportFactory();
      break;
  }

  // Uso polimórfico - cliente não conhece detalhes de implementação
  const report = await factory.generateReport(estimate);
  return report;
}
```

---

## 2. Builder (Construtor)

### Classificação GoF
- **Tipo:** Padrão Criacional
- **Escopo:** Objeto
- **Intenção:** Separar a construção de um objeto complexo de sua representação, permitindo que o mesmo processo de construção possa criar diferentes representações.

### Localização no Código

**Arquivo:** `src/domain/fpa/builders/estimate.builder.ts`

**Classes Envolvidas:**
- **Builder Interface:** `IEstimateBuilder`
- **Concrete Builder:** `EstimateBuilder`
- **Director (opcional):** `EstimateDirector`
- **Product:** `Estimate` entity

### Justificativa de Aplicação

A entidade `Estimate` é extremamente complexa, contendo:

- **14 características gerais do sistema (GSC)** com valores de 0-5
- **5 tipos de componentes FPA** (ALI, AIE, EI, EO, EQ)
- **Múltiplas dependências de cálculo:** PFNA → FA → PFA → Esforço
- **Validações complexas** em cada etapa de construção
- **20+ campos** entre obrigatórios e opcionais

**Problema Sem o Padrão:**
```typescript
// Construção direta - propensa a erros
const estimate = {
  name: 'Estimativa',
  description: 'Desc',
  projectId: new Types.ObjectId(projectId), // Pode esquecer conversão
  // ... esqueceu countType (obrigatório)
  // ... esqueceu applicationBoundary (obrigatório)
  teamSize: 5,
  // ... cálculos não foram executados
  // ... estado inválido criado
};
```

**Com o Builder:**
```typescript
// Construção guiada com validação
const estimate = new EstimateBuilder()
  .setBasicInfo(name, desc, projectId, orgId, userId) // Valida IDs
  .setCountType(CountType.DEVELOPMENT_PROJECT) // Enum seguro
  .setBoundaryAndScope(boundary, scope) // Valida strings
  .setTeamConfiguration(5, 150) // Valida ranges
  .build(); // Valida estado completo antes de retornar
```

**Benefícios Obtidos:**
- Interface fluente melhora legibilidade
- Validação incremental em cada etapa
- Estado sempre consistente (build() valida completude)
- Previne objetos em estado inválido
- Director encapsula configurações comuns

### Exemplo de Uso

```typescript
// src/application/fpa/use-cases/estimate-with-patterns.service.ts:37

async createEstimateUsingBuilder(params) {
  const builder = new EstimateBuilder();

  const estimate = builder
    .setBasicInfo(params.name, params.description, ...)
    .setCountType(params.countType)
    .setBoundaryAndScope(params.boundary, params.scope)
    .setTeamConfiguration(params.teamSize, params.hourlyRate)
    .setProductivityFactor(params.productivityFactor)
    .setStatus(EstimateStatus.DRAFT)
    .build(); // Lança erro se inválido

  return estimate;
}
```

---

## 3. Decorator (Decorador)

### Classificação GoF
- **Tipo:** Padrão Estrutural
- **Escopo:** Objeto
- **Intenção:** Anexar responsabilidades adicionais a um objeto dinamicamente. Decoradores fornecem uma alternativa flexível ao uso de subclasses para estender funcionalidades.

### Localização no Código

**Arquivos:**
- `src/infrastructure/decorators/repository-logger.decorator.ts` - Decorador de logging
- `src/infrastructure/decorators/repository-cache.decorator.ts` - Decorador de cache

**Classes Envolvidas:**
- **Component Interface:** `IBaseRepository<T>`
- **Concrete Components:** `UserRepository`, `ProjectRepository`, etc.
- **Decorators:** `LoggingRepositoryDecorator`, `CachingRepositoryDecorator`

### Justificativa de Aplicação

Os repositórios do sistema (User, Project, Organization, Estimate, etc.) necessitam de **preocupações transversais (cross-cutting concerns)**:

- **Logging:** Registrar todas operações de banco de dados
- **Caching:** Reduzir carga do MongoDB em operações de leitura
- **Métricas:** Tempo de execução de queries
- **Auditoria:** Rastrear mudanças

**Problema Sem o Padrão:**
```typescript
// Código poluído com logging
class UserRepository {
  async findById(id: string) {
    this.logger.log(`Finding user ${id}`); // Logging
    const startTime = Date.now(); // Metrics

    const user = await this.userModel.findById(id);

    this.logger.log(`Found user in ${Date.now() - startTime}ms`); // Logging
    return user;
  }
  // Repetir para create, update, delete, findAll...
}
```

**Com Decorator:**
```typescript
// Separação de responsabilidades
const baseRepo = new UserRepository(userModel);
const loggedRepo = new LoggingRepositoryDecorator(baseRepo, 'User');
const cachedRepo = new CachingRepositoryDecorator(loggedRepo, 'User', 60000);

// Uso transparente - mesma interface
const user = await cachedRepo.findById(id);
// Automaticamente: cache check → log → query → cache store → log
```

**Benefícios Obtidos:**
- Repositórios permanecem limpos e focados em lógica de dados
- Decoradores podem ser empilhados (stacking)
- Funcionalidades podem ser adicionadas/removidas em runtime
- Princípio Single Responsibility mantido
- Fácil teste unitário (decoradores podem ser removidos em testes)

### Exemplo de Empilhamento de Decoradores

```typescript
// Criar repositório com logging E caching
const repository = withLoggingAndCaching(
  new UserRepository(userModel),
  'User',
  300000 // 5 minutos de cache
);

// O decorator de cache chama o decorator de logging
// Que chama o repositório base
// Cache miss → logged → query → logged → cached
// Cache hit → logged → retorna cache
```

---

## 4. Chain of Responsibility (Cadeia de Responsabilidade)

### Classificação GoF
- **Tipo:** Padrão Comportamental
- **Escopo:** Objeto
- **Intenção:** Evitar acoplamento do remetente de uma solicitação ao seu receptor, dando a mais de um objeto a oportunidade de tratar a solicitação. Encadear os objetos receptores e passar a solicitação ao longo da cadeia até que um objeto a trate.

### Localização no Código

**Arquivos:**
- `src/domain/fpa/validators/validation-handler.ts` - Handler abstrato
- `src/domain/fpa/validators/fpa-validation-chain.ts` - Handlers concretos

**Classes Envolvidas:**
- **Handler Abstrato:** `ValidationHandler`
- **Handlers Concretos:**
  - `ComponentTypeValidator` - Valida tipo do componente
  - `DETValidator` - Valida Data Element Types
  - `TRFTRValidator` - Valida TR (data) ou FTR (transactional)
  - `ComplexityValidationHandler` - Calcula complexidade
  - `FunctionPointsValidator` - Valida pontos de função
  - `ConsistencyValidator` - Valida consistência geral
- **Cliente:** `FPAComponentValidator`

### Justificativa de Aplicação

A validação de componentes FPA requer **múltiplas etapas sequenciais**, onde cada etapa:

1. Depende do sucesso da etapa anterior
2. Pode falhar independentemente (early exit)
3. Pode adicionar warnings sem bloquear
4. Calcula valores usados nas próximas etapas

**Sequência de Validação FPA:**
```
ComponentType → DET → TR/FTR → Complexity → FunctionPoints → Consistency
      ↓           ↓       ↓          ↓             ↓              ↓
   Valida     Valida  Valida    Calcula       Valida        Cross-check
   enum      ranges  ranges   complexity      ranges        consistência
```

**Problema Sem o Padrão:**
```typescript
// Função monolítica com ifs aninhados
function validateComponent(type, param1, param2) {
  if (!validTypes.includes(type)) {
    return { valid: false, error: 'Invalid type' };
  }

  if (param2 < 1) {
    return { valid: false, error: 'DET invalid' };
  }

  if (type === 'ALI' || type === 'AIE') {
    if (param1 < 1) {
      return { valid: false, error: 'TR invalid' };
    }
    // ... mais 50 linhas de ifs
  } else {
    if (param1 < 0) {
      return { valid: false, error: 'FTR invalid' };
    }
    // ... mais 50 linhas de ifs
  }

  // Difícil de estender, testar e manter
}
```

**Com Chain of Responsibility:**
```typescript
// Cadeia de validadores especializados
const chain = new ComponentTypeValidator()
  .setNext(new DETValidator())
  .setNext(new TRFTRValidator())
  .setNext(new ComplexityValidationHandler())
  .setNext(new FunctionPointsValidator())
  .setNext(new ConsistencyValidator());

const result = await chain.handle(context);
// Early exit: Para no primeiro erro
// Warnings: Acumula mas continua
// Cada handler é testável isoladamente
```

**Benefícios Obtidos:**
- Cada validador tem responsabilidade única
- Fácil adicionar/remover/reordenar validadores
- Early exit otimiza performance
- Context object compartilha estado entre handlers
- Testável: cada handler pode ser testado isoladamente

### Exemplo de Uso

```typescript
// src/application/fpa/use-cases/estimate-with-patterns.service.ts:108

async validateFPAComponent(componentType, param1, param2) {
  const validator = new FPAComponentValidator(); // Constrói cadeia

  const result = await validator.validateComponent(
    componentType,
    param1,
    param2
  );

  // result.isValid = true/false
  // result.errors = [] (vazio se válido)
  // result.warnings = [] (não bloqueia)
  // result.context.complexity = calculado pela cadeia
  // result.context.functionPoints = calculado pela cadeia

  return result;
}
```

---

## 5. Observer (Observador)

### Classificação GoF
- **Tipo:** Padrão Comportamental
- **Escopo:** Objeto
- **Intenção:** Definir uma dependência um-para-muitos entre objetos, de modo que quando um objeto muda de estado, todos os seus dependentes são notificados e atualizados automaticamente.

### Localização no Código

**Arquivos:**
- `src/domain/fpa/observers/estimate-observer.interface.ts` - Interfaces
- `src/domain/fpa/observers/estimate-subject.ts` - Subject concreto
- `src/domain/fpa/observers/email-notification.observer.ts` - Observers concretos

**Classes Envolvidas:**
- **Subject Interface:** `IEstimateSubject`
- **Subject Concreto:** `EstimateSubject`
- **Observer Interface:** `IEstimateObserver`
- **Observers Concretos:**
  - `EmailNotificationObserver` - Envia emails
  - `LogObserver` - Registra em logs
  - `AuditObserver` - Salva trilha de auditoria

### Justificativa de Aplicação

Quando uma estimativa muda de status (DRAFT → FINALIZED → ARCHIVED), **múltiplas ações** precisam ocorrer:

1. **Email:** Notificar stakeholders
2. **Log:** Registrar mudança para debugging
3. **Auditoria:** Salvar em banco para compliance
4. **Webhooks:** Notificar sistemas externos (futuro)
5. **Métricas:** Atualizar dashboard (futuro)

**Problema Sem o Padrão:**
```typescript
// Acoplamento forte - difícil de manter
async changeStatus(estimate, newStatus) {
  estimate.status = newStatus;

  // Service acoplado a TODAS as ações
  await this.emailService.send(...);
  await this.logger.log(...);
  await this.auditRepo.save(...);
  await this.webhookService.trigger(...);
  // Adicionar nova ação? Modificar este método!

  await this.estimateRepo.update(estimate);
}
```

**Com Observer:**
```typescript
// Desacoplamento - extensível
constructor() {
  this.subject = new EstimateSubject();
  this.subject.attach(new EmailNotificationObserver());
  this.subject.attach(new LogObserver());
  this.subject.attach(new AuditObserver());
  // Adicionar observer = 1 linha, sem modificar código existente
}

async changeStatus(estimate, newStatus) {
  const previousStatus = estimate.status;
  estimate.status = newStatus;

  // Notifica TODOS os observers automaticamente
  await this.subject.notify({
    estimate,
    previousStatus,
    newStatus,
    changedBy,
    changedAt: new Date()
  });

  await this.estimateRepo.update(estimate);
}
```

**Benefícios Obtidos:**
- Service desacoplado das ações de notificação
- Observers podem ser adicionados/removidos dinamicamente
- Cada observer tem responsabilidade única
- Falha em um observer não afeta outros (Promise.allSettled)
- Fácil teste: pode remover observers ou adicionar mocks
- Filtros: observers podem ignorar eventos irrelevantes (shouldNotify)

### Exemplo de Uso

```typescript
// src/application/fpa/use-cases/estimate-with-patterns.service.ts:63

async changeEstimateStatus(estimate, newStatus, changedBy, reason) {
  const previousStatus = estimate.status;
  estimate.status = newStatus;

  // Observer Pattern: Notifica todos os observers
  await this.estimateSubject.notify({
    estimate,
    previousStatus,
    newStatus,
    changedBy,
    changedAt: new Date(),
    reason
  });

  // Observers executam automaticamente:
  // - EmailNotificationObserver envia email
  // - LogObserver registra no log
  // - AuditObserver salva auditoria
}
```

### Filtro de Eventos

```typescript
// Observer pode filtrar eventos que não lhe interessam
shouldNotify(event: EstimateStatusChangeEvent): boolean {
  // EmailObserver: só notificar FINALIZED e ARCHIVED
  return [EstimateStatus.FINALIZED, EstimateStatus.ARCHIVED]
    .includes(event.newStatus);
}
```

---

## 6. Singleton (Único)

### Classificação GoF
- **Tipo:** Padrão Criacional
- **Escopo:** Objeto
- **Intenção:** Garantir que uma classe tenha apenas uma instância e fornecer um ponto global de acesso a ela.

### Localização no Código

**Arquivo:** `src/domain/fpa/services/complexity-calculator.service.ts`

**Classe:** `ComplexityCalculator`

### Justificativa de Aplicação

O `ComplexityCalculator` contém:

- **Matrizes de complexidade FPA** (constantes oficiais IFPUG)
- **Algoritmos de cálculo** (métodos puros/stateless)
- **Valores de pontos de função** por complexidade

Estas informações são:
- **Imutáveis** - nunca mudam
- **Compartilhadas** - usadas em todo o sistema
- **Stateless** - sem estado mutável
- **Únicas** - uma única fonte de verdade

**Implementação:**

```typescript
@Injectable() // NestJS garante singleton
export class ComplexityCalculator {
  // Matrizes são static readonly - compartilhadas
  private static readonly dataFunctionMatrix = [...];
  private static readonly eiMatrix = [...];

  // Métodos são static - não precisam de instância
  static calculateILFComplexity(trs, dets) {
    const trIndex = this.calculateTRIndex(trs);
    const detIndex = this.calculateDataFunctionDETIndex(dets);
    return this.dataFunctionMatrix[trIndex][detIndex];
  }
}
```

**Benefícios Obtidos:**
- Uma única instância em memória (economia de recursos)
- Ponto global de acesso via static methods
- Matrizes compartilhadas (não duplicadas)
- Thread-safe (stateless)
- @Injectable permite injeção de dependência quando necessário

### Exemplo de Uso

```typescript
// Uso direto sem instanciação
const result = ComplexityCalculator.calculateILFComplexity(3, 25);
// result = { complexity: 'AVERAGE', functionPoints: 10 }

// Ou via injeção de dependência (NestJS singleton)
constructor(private readonly calculator: ComplexityCalculator) {}

useCalculator() {
  const result = ComplexityCalculator.calculateEIComplexity(2, 10);
}
```

---

## Resumo de Aplicação dos Padrões

### Mapa de Localização

```
src/
├── domain/fpa/
│   ├── builders/
│   │   └── estimate.builder.ts .................... BUILDER
│   ├── factories/
│   │   ├── report.factory.ts ..................... FACTORY METHOD
│   │   ├── pdf-report.factory.ts ................. FACTORY METHOD
│   │   ├── csv-report.factory.ts ................. FACTORY METHOD
│   │   └── json-report.factory.ts ................ FACTORY METHOD
│   ├── observers/
│   │   ├── estimate-observer.interface.ts ........ OBSERVER
│   │   ├── estimate-subject.ts ................... OBSERVER
│   │   └── email-notification.observer.ts ........ OBSERVER
│   ├── validators/
│   │   ├── validation-handler.ts ................. CHAIN OF RESPONSIBILITY
│   │   └── fpa-validation-chain.ts ............... CHAIN OF RESPONSIBILITY
│   └── services/
│       └── complexity-calculator.service.ts ...... SINGLETON
├── infrastructure/decorators/
│   ├── repository-logger.decorator.ts ............ DECORATOR
│   └── repository-cache.decorator.ts ............. DECORATOR
└── application/fpa/use-cases/
    └── estimate-with-patterns.service.ts ......... DEMO DE TODOS OS PADRÕES
```

### Estatísticas

- **Total de Arquivos Criados:** 13
- **Total de Arquivos Modificados:** 1
- **Total de Padrões Implementados:** 6
- **Padrões Criacionais:** 3 (Factory Method, Builder, Singleton)
- **Padrões Estruturais:** 1 (Decorator)
- **Padrões Comportamentais:** 2 (Chain of Responsibility, Observer)
- **Linhas de Código:** ~2.500 linhas
- **Cobertura de Documentação:** 100%

### Tabela de Mapeamento Padrão → Classes

| Padrão | Classes Principais | Quantidade |
|--------|-------------------|------------|
| Factory Method | ReportFactory, PDFReportFactory, CSVReportFactory, JSONReportFactory | 7 |
| Builder | EstimateBuilder, EstimateDirector | 2 |
| Decorator | LoggingRepositoryDecorator, CachingRepositoryDecorator | 2 |
| Chain of Responsibility | ValidationHandler + 6 concrete handlers | 7 |
| Observer | EstimateSubject, EmailNotificationObserver, LogObserver, AuditObserver | 4 |
| Singleton | ComplexityCalculator | 1 |
| **TOTAL** | | **23 classes** |

---

## Integração dos Padrões

Os padrões não foram implementados de forma isolada - eles trabalham juntos em workflows completos:

### Workflow: Criar e Finalizar Estimativa

```typescript
// 1. BUILDER: Criar estimativa com validação
const estimate = new EstimateBuilder()
  .setBasicInfo(...)
  .setTeamConfiguration(...)
  .build();

// 2. CHAIN OF RESPONSIBILITY: Validar componentes
const validator = new FPAComponentValidator();
const validationResult = await validator.validateComponent('ALI', 3, 25);

// 3. OBSERVER: Notificar mudança de status
await estimateSubject.notify({
  estimate,
  previousStatus: 'DRAFT',
  newStatus: 'FINALIZED',
  changedBy: userId
});

// 4. FACTORY METHOD: Gerar relatório
const factory = new PDFReportFactory();
const report = await factory.generateReport(estimate);
```

### Workflow: Repository com Logging e Cache

```typescript
// DECORATOR: Empilhar comportamentos
const baseRepo = new EstimateRepository(model);
const loggedRepo = new LoggingRepositoryDecorator(baseRepo, 'Estimate');
const cachedRepo = new CachingRepositoryDecorator(loggedRepo, 'Estimate');

// Uso transparente com ambos decoradores ativos
const estimate = await cachedRepo.findById(id);
// Fluxo: cache check → log → query → cache store → log → return
```

---

## Análise de Qualidade

### Princípios SOLID Atendidos

| Princípio | Padrão que Auxilia | Como |
|-----------|-------------------|------|
| **S**ingle Responsibility | Todos | Cada classe tem uma única responsabilidade |
| **O**pen/Closed | Factory Method, Decorator, Chain | Extensível sem modificação |
| **L**iskov Substitution | Factory Method, Decorator | Subclasses substituíveis |
| **I**nterface Segregation | Todos | Interfaces específicas e coesas |
| **D**ependency Inversion | Todos | Dependência de abstrações |

### Métricas de Qualidade

- **Coesão:** Alta - cada classe tem responsabilidade única
- **Acoplamento:** Baixo - classes dependem de interfaces
- **Testabilidade:** Alta - cada componente testável isoladamente
- **Manutenibilidade:** Alta - padrões facilitam mudanças
- **Extensibilidade:** Alta - novos comportamentos sem modificar código

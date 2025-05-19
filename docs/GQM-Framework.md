# Goal-Question-Metric (GQM) Framework

## Table of Contents

- [Introduction](#introduction)
- [Core Concepts](#core-concepts)
- [GQM Hierarchy](#gqm-hierarchy)
- [Implementation in Measura](#implementation-in-measura)
  - [Core Entities](#core-entities)
  - [Entity Relationships](#entity-relationships)
  - [Architectural Implementation](#architectural-implementation)
- [Data Flow](#data-flow)
- [Use Cases](#use-cases)
- [API Endpoints](#api-endpoints)

## Introduction

The Goal-Question-Metric (GQM) approach is a measurement framework for software development and improvement, initially developed by Victor Basili and his colleagues at the University of Maryland. It provides a structured method to define measurement goals and refine them into specific metrics through a set of questions.

GQM is a top-down, goal-oriented approach that starts with organizational goals and refines them into measurable metrics through intermediate questions. This ensures that all measurement activities are purposeful and aligned with organizational objectives.

## Core Concepts

The GQM approach operates on three levels:

1. **Goal Level (Conceptual)**: Defines what is to be improved or achieved. Goals are set for objects (products, processes, resources) for various reasons, with respect to various quality models, from various viewpoints, and in various contexts.

2. **Question Level (Operational)**: Represents a set of questions used to characterize the way the assessment/achievement of a specific goal is going to be performed.

3. **Metric Level (Quantitative)**: Represents a set of metrics, based on the models, associated with every question in order to answer it in a quantitative way.

## GQM Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│                            GOAL                              │
│  Purpose: Improve, analyze, evaluate                         │
│  Issue: Effectiveness, correctness, etc.                     │
│  Object: Product, process, resource                          │
│  Viewpoint: Developer, manager, customer                     │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                          QUESTIONS                           │
│  Q1: Does the system meet user requirements?                 │
│  Q2: How reliable is the system?                             │
│  Q3: How maintainable is the code?                           │
└───────────┬─────────────────┬─────────────────┬──────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│      METRICS      │ │      METRICS      │ │      METRICS      │
│ M1.1: User        │ │ M2.1: Uptime      │ │ M3.1: Cyclomatic  │
│      satisfaction │ │      percentage   │ │      complexity   │
│ M1.2: Feature     │ │ M2.2: Mean time   │ │ M3.2: Comment     │
│      completion   │ │      to recovery  │ │      ratio        │
└───────────────────┘ └───────────────────┘ └───────────────────┘
```

## Implementation in Measura

In the Measura backend, the GQM framework is implemented through several entity types:

### Core Entities

1. **Goal**: Represents what the organization wants to achieve or improve.

   - Contains properties like name, description, status, and priority.
   - A goal can be associated with multiple questions.

2. **Question**: Represents questions that need to be answered to determine if a goal is being met.

   - Contains properties like question text, importance, and associated goal.
   - A question can be associated with multiple metrics.

3. **Metric**: Represents specific measurements that provide answers to questions.

   - Contains properties like name, description, unit of measurement, and formula.
   - A metric is associated with a specific question and can be used in measurements.

4. **Objective**: Represents specific, measurable targets related to goals.

   - Contains properties like description, target values, and associated goals.

5. **Plan**: Represents a measurement plan that groups related goals and objectives.
   - Contains properties like name, description, status, and timeframe.

### Entity Relationships

```
┌─────────────┐     1:n     ┌─────────────┐     1:n     ┌─────────────┐
│    PLAN     │─────────────│    GOAL     │─────────────│  QUESTION   │
└─────────────┘             └─────────────┘             └─────────────┘
       │                           │                           │
       │                           │                           │
       │                           │                           │ 1:n
       │                     1:n   │                           │
       │                           ▼                           ▼
       │                    ┌─────────────┐             ┌─────────────┐
       └───────────────────│  OBJECTIVE   │             │   METRIC    │
                           └─────────────┘             └─────────────┘
```

### Architectural Implementation

The Measura backend implements the GQM framework using a clean architecture approach, with distinct layers:

#### Domain Layer

The domain layer contains the core entities, interfaces, and business logic:

```
/src/domain/
├── goals/
│   ├── entities/
│   │   └── goal.entity.ts           # Goal entity definition
│   ├── interfaces/
│   │   └── goal.repository.interface.ts # Repository interface
│   └── dtos/
│       ├── create-goal.dto.ts       # Data transfer objects
│       ├── update-goal.dto.ts
│       └── goal.dto.ts
├── questions/
│   ├── entities/
│   │   └── question.entity.ts
│   ├── interfaces/
│   │   └── question.repository.interface.ts
│   └── dtos/
├── metrics/
│   ├── entities/
│   │   └── metric.entity.ts
│   ├── interfaces/
│   │   └── metric.repository.interface.ts
│   └── dtos/
├── objectives/
└── plans/
```

#### Application Layer

The application layer contains use cases and service implementations:

```
/src/application/
├── goals/
│   └── use-cases/
│       └── goal.service.ts          # Goal service implementation
├── questions/
│   └── use-cases/
│       └── question.service.ts
├── metrics/
│   └── use-cases/
│       └── metric.service.ts
├── objectives/
└── gqm/
    └── use-cases/
        └── gqm.service.ts           # Service for GQM tree operations
```

#### Infrastructure Layer

The infrastructure layer contains implementations of interfaces defined in the domain layer:

```
/src/infrastructure/
├── repositories/
│   ├── goals/
│   │   └── goal.repository.ts       # MongoDB implementation of repository
│   ├── questions/
│   │   └── question.repository.ts
│   └── metrics/
│       └── metric.repository.ts
└── database/
    └── mongodb/
        ├── schemas/                 # MongoDB schemas
        └── repositories/            # Alternative repository implementations
```

#### Interface Layer

The interface layer contains controllers and other adapters:

```
/src/interfaces/
└── api/
    └── controllers/
        ├── goals/
        │   ├── goal.controller.ts   # REST API endpoints for goals
        │   └── goals.module.ts      # NestJS module definition
        ├── questions/
        │   ├── questions.controller.ts
        │   └── questions.module.ts
        ├── metrics/
        │   ├── metrics.controller.ts
        │   └── metrics.module.ts
        └── gqm/
            ├── gqm.controller.ts    # Controller for GQM tree operations
            └── gqm.module.ts
```

## Data Flow

The data flow in the Measura GQM implementation follows these typical patterns:

1. **Creation Flow**:

   ```
   Create Goal → Create Questions for Goal → Create Metrics for Questions → Create Objectives → Create Plan
   ```

2. **Query Flow**:
   ```
   Query Plan → Get Goals and Objectives → Get Questions for Goals → Get Metrics for Questions
   ```

### Sequence Diagram (Simple)

```
┌─────────┐    ┌─────────────┐    ┌───────────────┐    ┌─────────────┐    ┌─────────────┐
│  User   │    │GoalController│    │QuestionService│    │MetricService│    │  Database   │
└────┬────┘    └──────┬──────┘    └───────┬───────┘    └──────┬──────┘    └──────┬──────┘
     │                │                   │                    │                  │
     │  Create Goal   │                   │                    │                  │
     │───────────────>│                   │                    │                  │
     │                │   Save Goal       │                    │                  │
     │                │──────────────────────────────────────────────────────────>│
     │                │                   │                    │                  │
     │  Create Question                   │                    │                  │
     │───────────────>│                   │                    │                  │
     │                │ Create Question   │                    │                  │
     │                │────────────────────>                   │                  │
     │                │                   │  Save Question     │                  │
     │                │                   │─────────────────────────────────────>│
     │                │                   │                    │                  │
     │  Create Metric │                   │                    │                  │
     │───────────────>│                   │                    │                  │
     │                │                   │  Create Metric     │                  │
     │                │───────────────────────────────────────>│                  │
     │                │                   │                    │ Save Metric      │
     │                │                   │                    │─────────────────>│
     │                │                   │                    │                  │
```

## Use Cases

Here are some common use cases for GQM in software development:

1. **Quality Improvement**:

   - Goal: Improve code quality
   - Question: Is the code maintainable?
   - Metrics: Cyclomatic complexity, comment ratio, test coverage

2. **Performance Optimization**:

   - Goal: Enhance system performance
   - Question: Is the system responding quickly enough?
   - Metrics: Response time, throughput, resource utilization

3. **Process Efficiency**:

   - Goal: Reduce development time
   - Question: Are we delivering features efficiently?
   - Metrics: Lead time, velocity, deployment frequency

4. **User Satisfaction**:
   - Goal: Improve user experience
   - Question: Are users satisfied with the software?
   - Metrics: User satisfaction rating, feature usage, support tickets

## API Endpoints

The Measura backend exposes the following key API endpoints for GQM operations:

### Goal Endpoints

- `GET /goals` - Get all goals
- `GET /goals/:id` - Get a specific goal
- `POST /goals` - Create a new goal
- `PUT /goals/:id` - Update a goal
- `DELETE /goals/:id` - Delete a goal

### Question Endpoints

- `GET /questions` - Get all questions
- `GET /questions/:id` - Get a specific question
- `GET /questions/goal/:goalId` - Get questions for a specific goal
- `POST /questions` - Create a new question
- `PUT /questions/:id` - Update a question
- `DELETE /questions/:id` - Delete a question

### Metric Endpoints

- `GET /metrics` - Get all metrics
- `GET /metrics/:id` - Get a specific metric
- `GET /metrics/question/:questionId` - Get metrics for a specific question
- `POST /metrics` - Create a new metric
- `PUT /metrics/:id` - Update a metric
- `DELETE /metrics/:id` - Delete a metric

### GQM Tree Endpoints

- `GET /gqm/goal/:goalId` - Get the complete GQM tree for a specific goal
- `GET /gqm/user` - Get all GQM trees for the current user

The GQM approach provides a clear path from strategic goals to concrete measurements, ensuring that all measurement activities serve a clear purpose and contribute to organizational objectives.

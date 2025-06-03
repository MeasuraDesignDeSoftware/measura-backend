# Function Point Analysis (FPA) Framework

## Table of Contents

- [Introduction](#introduction)
- [Core Concepts](#core-concepts)
- [FPA Components](#fpa-components)
- [Implementation in Measura](#implementation-in-measura)
  - [Core Entities](#core-entities)
  - [Entity Relationships](#entity-relationships)
  - [Architectural Implementation](#architectural-implementation)
- [Report Generation](#report-generation)
- [Use Cases](#use-cases)
- [API Endpoints](#api-endpoints)

## Introduction

Function Point Analysis (FPA) is a standardized method for measuring the functional size of software. Developed by Allan Albrecht at IBM in the late 1970s, it has become a widely accepted industry standard for software size estimation. FPA measures software size by quantifying the functionality provided to the user based on logical design rather than technical implementation.

In Measura, FPA is implemented as a comprehensive module that allows organizations to create, manage, and analyze software projects using the function point methodology. This enables more accurate effort estimation, productivity measurement, and comparison between projects.

## Core Concepts

Function Point Analysis operates by identifying and classifying functional components of software applications:

1. **Data Functions**: Represent the data that the application manages

   - **Internal Logical Files (ILF)**: Data maintained within the system boundary
   - **External Interface Files (EIF)**: Data referenced but not maintained within the system

2. **Transactional Functions**: Represent the operations that users can perform

   - **External Inputs (EI)**: Processes that bring data into the system
   - **External Outputs (EO)**: Processes that send data out of the system
   - **External Queries (EQ)**: Processes that retrieve data without updating

3. **General System Characteristics (GSC)**: 14 factors that affect the overall complexity of the system

4. **Complexity Assessment**: Each component is evaluated for complexity (Low, Average, High) based on:
   - For data functions: Number of Record Element Types (RETs) and Data Element Types (DETs)
   - For transactional functions: Number of File Types Referenced (FTRs) and DETs

## FPA Components

```
┌───────────────────────────────────────────────────────┐
│              Function Point Analysis                  │
└───────────────┬───────────────────────┬───────────────┘
                │                       │
    ┌───────────▼─────────┐   ┌─────────▼───────────┐
    │    Data Functions   │   │Transaction Functions│
    └─────────┬───────────┘   └─────────┬───────────┘
              │                         │
   ┌──────────┼──────────┐   ┌──────────┼──────────┐
   │          │          │   │          │          │
┌──▼──┐    ┌──▼──┐    ┌──▼──┐    ┌──▼──┐    ┌──▼──┐
│ ILF │    │ EIF │    │ EI  │    │ EO  │    │ EQ  │
└─────┘    └─────┘    └─────┘    └─────┘    └─────┘

┌───────────────────────────────────────────────────────┐
│         General System Characteristics (GSC)          │
└───────────────────────────────────────────────────────┘
```

## Implementation in Measura

In the Measura backend, the FPA framework is implemented through several entity types:

### Core Entities

1. **Estimate**: Represents a function point count for a specific project.

   - Contains properties like name, description, version, status, and calculated function points.
   - Associated with multiple ILFs, EIFs, EIs, EOs, and EQs.
   - Stores GSC values and derived metrics like VAF (Value Adjustment Factor).

2. **ALI (Internal Logical File)**: Represents data maintained within the application boundary.

   - Contains properties like name, complexity, and data element types.

3. **AIE (External Interface File)**: Represents data referenced but not maintained by the application.

   - Contains properties similar to ILF but represents external data.

4. **EI (External Input)**: Represents processes that bring data into the system.

   - Contains properties defining input characteristics and complexity.

5. **EO (External Output)**: Represents processes that generate output from the system.

   - Contains properties defining output characteristics and complexity.

6. **EQ (External Query)**: Represents processes that retrieve data without modifying it.
   - Contains properties defining query characteristics and complexity.

### Entity Relationships

```
┌─────────────┐
│   PROJECT   │
└──────┬──────┘
       │
       │ 1:n
       ▼
┌─────────────┐     1:n     ┌─────────────┐
│  ESTIMATE   │─────────────│    USER     │
└─────┬───────┘             └─────────────┘
      │
      │ 1:n
      ▼
┌─────────────────────────────────────────┐
│           FPA COMPONENTS                │
├─────────┬─────────┬─────────┬───────────┤
│   ILF   │   EIF   │   EI    │  EO & EQ  │
└─────────┴─────────┴─────────┴───────────┘
```

### Architectural Implementation

The Measura backend implements the FPA framework using a clean architecture approach, with distinct layers:

#### Domain Layer

The domain layer contains the core entities, interfaces, and business logic:

```
/src/domain/
├── fpa/
│   ├── entities/
│   │   ├── estimate.entity.ts        # Estimate entity definition
│   │   ├── document.entity.ts        # Document entity with MongoDB schema
│   │   ├── ali.entity.ts             # Internal Logical File entity
│   │   ├── aie.entity.ts             # External Interface File entity
│   │   ├── ei.entity.ts              # External Input entity
│   │   ├── eo.entity.ts              # External Output entity
│   │   └── eq.entity.ts              # External Query entity
│   ├── interfaces/
│   │   ├── estimate.repository.interface.ts
│   │   ├── document.repository.interface.ts  # Document repository interface
│   │   ├── ali.repository.interface.ts
│   │   └── ...
│   └── services/
│       ├── complexity-calculator.service.ts
│       ├── function-point-calculator.service.ts
│       ├── team-size-estimation.service.ts
│       ├── trend-analysis.service.ts
│       ├── report-generator.service.ts
│       ├── document.service.ts              # Document management service
│       └── estimate-document.service.ts     # Estimate-document integration service
```

#### Infrastructure Layer

The infrastructure layer contains implementations of interfaces defined in the domain layer:

```
/src/infrastructure/
├── repositories/
│   └── fpa/
│       ├── estimate.repository.ts    # MongoDB implementation of repository
│       ├── document.repository.ts    # MongoDB document repository
│       ├── ali.repository.ts
│       ├── aie.repository.ts
│       ├── ei.repository.ts
│       ├── eo.repository.ts
│       └── eq.repository.ts
```

#### Interface Layer

The interface layer contains controllers and other adapters:

```
/src/controllers/
└── fpa/
    ├── estimates.controller.ts     # CRUD operations for estimates
    ├── documents.controller.ts     # Document management endpoints
    ├── reports.controller.ts       # Report generation endpoints
    ├── calculations.controller.ts  # Function point calculation endpoints
    ├── trends.controller.ts        # Trend analysis endpoints
    └── components/                 # Component management
        ├── ali.controller.ts       # ILF management
        ├── aie.controller.ts       # EIF management
        ├── ei.controller.ts        # EI management
        ├── eo.controller.ts        # EO management
        └── eq.controller.ts        # EQ management
```

## Report Generation

The Measura FPA module includes comprehensive report generation capabilities:

### Report Types

1. **Detailed Report**: In-depth analysis of a single estimate with all metrics

   - Project information
   - Function point counts by component type
   - GSC details
   - Effort estimation
   - Team size and duration estimation

2. **Summary Report**: Brief overview with key metrics

   - Total and adjusted function points
   - Estimated effort
   - Team size
   - Duration

3. **Comparison Report**: Side-by-side comparison of multiple versions of an estimate
   - Percentage differences between versions
   - Trend analysis
   - Historical progression

### Output Formats

All reports can be generated in multiple formats:

- **JSON**: Structured data format for programmatic access
- **HTML**: Human-readable format with styling
- **PDF**: Printable document format generated using Puppeteer

## Use Cases

Here are some common use cases for FPA in software development:

1. **Project Estimation**:

   - Estimate the size of a new software project
   - Calculate expected effort based on productivity rates
   - Determine appropriate team size and project duration

2. **Project Comparison**:

   - Compare different projects in terms of size and complexity
   - Analyze productivity differences between teams or technologies
   - Establish benchmarks for future projects

3. **Version Tracking**:

   - Track changes in project scope over time
   - Identify scope creep or requirement changes
   - Document the evolution of software requirements

4. **Productivity Analysis**:
   - Calculate productivity rates (hours per function point)
   - Compare team performance across projects
   - Identify process improvement opportunities

## Document Management Integration

The FPA module includes comprehensive document management capabilities to support estimate documentation and evidence collection.

### Document Types Supported

- **USER_STORY**: User stories and requirements documents
- **USE_CASE**: Use case specifications and scenarios
- **INTERFACE_SPECIFICATION**: API and interface documentation
- **DATA_MODEL**: Database schemas and data models
- **OTHER**: General supporting documents

### Document Storage Options

1. **File Upload**: Physical files stored on the server

   - Supported formats: PDF, Word documents, Excel spreadsheets, images, text files
   - Configurable size limits and storage paths
   - Automatic file validation and unique naming

2. **URL References**: Links to external documents
   - SharePoint, Google Drive, or other cloud storage
   - Validation of URL format
   - Metadata storage without file duplication

### Document Entity Structure

```typescript
{
  _id: ObjectId,
  name: string,
  type: DocumentType,
  url?: string,              // For URL references
  filePath?: string,         // For uploaded files
  description?: string,
  estimateId: ObjectId,      // Link to estimate
  createdBy: ObjectId,       // User who created/uploaded
  fileSize?: number,         // File size in bytes
  mimeType?: string,         // MIME type for files
  originalFilename?: string, // Original file name
  createdAt: Date,
  updatedAt: Date
}
```

### Integration with Estimates

Documents are tightly integrated with FPA estimates:

- Each document is linked to a specific estimate
- Document references are maintained in the estimate entity
- Cascade operations ensure data consistency
- Migration utilities for existing data

### Security and Access Control

- JWT authentication required for all document operations
- User tracking for audit trails
- File access control through ownership
- Secure file storage with configurable paths

## API Endpoints

The Measura backend exposes the following key API endpoints for FPA operations:

### Document Endpoints

- `POST /estimates/documents/upload` - Upload a supporting document
- `POST /estimates/documents/url-reference` - Create a URL reference to external document
- `GET /estimates/documents/estimate/:estimateId` - Get all documents for an estimate
- `GET /estimates/documents/:documentId` - Get document details
- `GET /estimates/documents/:documentId/download` - Download a file document
- `POST /estimates/documents/:documentId/update` - Update document metadata
- `DELETE /estimates/documents/:documentId` - Delete a document

### Estimate Endpoints

- `GET /estimates` - Get all estimates
- `GET /estimates?projectId={id}` - Get estimates for a specific project
- `GET /estimates/:id` - Get a specific estimate
- `POST /estimates` - Create a new estimate
- `PUT /estimates/:id` - Update an estimate
- `DELETE /estimates/:id` - Delete an estimate
- `POST /estimates/:id/version` - Create a new version of an estimate

### Function Point Component Endpoints

#### Internal Logical Files (ILF)

- `GET /estimates/:estimateId/ilf` - Get all ILFs for an estimate
- `GET /estimates/:estimateId/ilf/:id` - Get a specific ILF
- `POST /estimates/:estimateId/ilf` - Add an ILF to an estimate
- `PUT /estimates/:estimateId/ilf/:id` - Update an ILF
- `DELETE /estimates/:estimateId/ilf/:id` - Remove an ILF from an estimate

#### External Interface Files (EIF)

- `GET /estimates/:estimateId/eif` - Get all EIFs for an estimate
- `GET /estimates/:estimateId/eif/:id` - Get a specific EIF
- `POST /estimates/:estimateId/eif` - Add an EIF to an estimate
- `PUT /estimates/:estimateId/eif/:id` - Update an EIF
- `DELETE /estimates/:estimateId/eif/:id` - Remove an EIF from an estimate

#### External Inputs (EI)

- `GET /estimates/:estimateId/ei` - Get all EIs for an estimate
- `GET /estimates/:estimateId/ei/:id` - Get a specific EI
- `POST /estimates/:estimateId/ei` - Add an EI to an estimate
- `PUT /estimates/:estimateId/ei/:id` - Update an EI
- `DELETE /estimates/:estimateId/ei/:id` - Remove an EI from an estimate

#### External Outputs (EO)

- `GET /estimates/:estimateId/eo` - Get all EOs for an estimate
- `GET /estimates/:estimateId/eo/:id` - Get a specific EO
- `POST /estimates/:estimateId/eo` - Add an EO to an estimate
- `PUT /estimates/:estimateId/eo/:id` - Update an EO
- `DELETE /estimates/:estimateId/eo/:id` - Remove an EO from an estimate

#### External Queries (EQ)

- `GET /estimates/:estimateId/eq` - Get all EQs for an estimate
- `GET /estimates/:estimateId/eq/:id` - Get a specific EQ
- `POST /estimates/:estimateId/eq` - Add an EQ to an estimate
- `PUT /estimates/:estimateId/eq/:id` - Update an EQ
- `DELETE /estimates/:estimateId/eq/:id` - Remove an EQ from an estimate

### Calculation Endpoints

- `POST /estimates/:id/calculate` - Recalculate function points after component changes
- `GET /estimates/:id/effort` - Get effort estimation with optional custom productivity factor
- `GET /estimates/:id/team-size` - Get team size and duration recommendations

### Trend Analysis Endpoints

- `GET /estimates/trends` - Get function point trends across estimates
- `GET /estimates/trends?projectId={id}` - Get trends for a specific project
- `GET /estimates/trends?metric={fp|effort|vaf}` - Analyze trends for different metrics

### Report Endpoints

- `GET /estimates/reports/:id/detailed?format={json|html|pdf}` - Generate a detailed report
- `GET /estimates/reports/:id/summary?format={json|html|pdf}` - Generate a summary report
- `POST /estimates/reports/comparison?format={json|html|pdf}` - Generate a comparison report
- `GET /estimates/:id/export?format={json|csv|pdf}` - Export an estimate in various formats

---

Function Point Analysis provides a structured approach to software sizing and estimation, enabling organizations to better plan resources, track progress, and measure productivity. The implementation in Measura makes this powerful methodology accessible and practical for software development teams.

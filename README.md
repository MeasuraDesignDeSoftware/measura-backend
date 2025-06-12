# Measura - Software Measurement and Estimation Platform

[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green.svg)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

## Overview

Measura is a comprehensive web-based solution designed to support software measurement processes and project estimation for IT organizations. Built on established methodologies like GQM (Goal-Question-Metric), MR-MPS-SW measurement processes, and Function Point Analysis (FPA), Measura helps teams align metrics with organizational goals, automate measurements, and improve estimation accuracy.

### Features

#### Core Measurement Capabilities

- **Goal-Based Measurement**: Implement the GQM approach to define objectives, questions, and metrics
- **Measurement Planning**: Create structured measurement plans aligned with business goals
- **Data Collection**: Manual and automated data collection from development tools
- **Report Generation**: Generate detailed, summary, and comparison reports in multiple formats

#### Function Point Analysis (FPA)

- **Complete FPA Implementation**: Create and manage FPA estimates with detailed component tracking
- **Component Management**: Support for ALI, AIE, EI, EO, and EQ components with complexity calculation
- **Estimation Metrics**: Team size estimation, trend analysis, and productivity calculations
- **Document Management**: Upload and manage supporting documents with database integration
- **Export Capabilities**: Export estimates in multiple formats (JSON, CSV, PDF)

#### System Features

- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **Role-Based Access**: Separate interfaces for project managers and measurement analysts
- **API Integration**: RESTful API with comprehensive Swagger documentation
- **Authentication**: JWT-based authentication with role-based access control
- **Database Integration**: MongoDB with optimized schemas and indexing

## Documentation

Comprehensive documentation for Measura is available in the [docs](./docs) directory:

- **[GQM Framework](./docs/GQM-Framework.md)** - Goal-Question-Metric implementation guide
- **[FPA Framework](./docs/FPA-Framework.md)** - Function Point Analysis implementation details
- **[Document Service](./docs/Document-Service-Implementation.md)** - Document management system documentation
- **[API Reference](http://localhost:3000/api)** - Swagger API documentation (available when app is running)
- **[Development Status](./TODO.md)** - Current development status and upcoming features

## Architecture

Measura follows Clean Architecture principles with Domain-Driven Design (DDD) and uses absolute imports for better maintainability:

```
src/
├── domain/                 # Business Logic Layer
│   ├── auth/              # Authentication domain
│   ├── fpa/               # Function Point Analysis domain
│   │   ├── entities/      # FPA entities (ALI, AIE, EI, EO, EQ, Estimate, Document)
│   │   ├── interfaces/    # Repository interfaces
│   │   └── services/      # Domain services (calculations, document management)
│   ├── gqm/               # GQM domain (goals, questions, metrics, objectives)
│   ├── plans/             # Measurement plans domain
│   ├── projects/          # Projects domain
│   └── users/             # Users domain
├── application/           # Use Cases Layer
│   ├── auth/             # Authentication use cases
│   ├── fpa/              # FPA use cases and DTOs
│   ├── gqm/              # GQM use cases
│   └── ...               # Other domain use cases
├── infrastructure/        # External Concerns Layer
│   ├── repositories/     # Domain-organized repositories
│   │   ├── auth/         # Authentication repositories
│   │   ├── fpa/          # FPA repositories (including document repository)
│   │   ├── gqm/          # GQM repositories (goals, questions, metrics, objectives)
│   │   └── ...           # Other domain repositories
│   ├── database/         # Database configuration
│   └── external-services/# External service integrations
├── controllers/          # Interface Adapters Layer
│   ├── auth/            # Authentication controllers
│   ├── fpa/             # FPA controllers (estimates, documents, components)
│   ├── gqm/             # GQM controllers (goals, questions, metrics)
│   └── ...              # Other domain controllers
├── modules/              # NestJS Modules (Composition Root)
│   ├── auth/            # Authentication module
│   ├── fpa/             # FPA module
│   ├── gqm/             # GQM module
│   └── ...              # Other domain modules
├── shared/               # Shared Utilities
│   ├── config/          # Configuration files
│   ├── utils/           # Common utilities and constants
│   └── modules/         # Shared domain modules
└── config/               # Application configuration
```

### Path Aliases

The project uses absolute imports with the following path aliases:

- `@domain/*` - Domain layer components
- `@application/*` - Application layer components
- `@infrastructure/*` - Infrastructure layer components
- `@controllers/*` - Controllers and API endpoints
- `@shared/*` - Shared utilities and configurations

## Technology Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) 10.x with TypeScript
- **Database**: [MongoDB](https://www.mongodb.com/) 7.x with Mongoose ODM
- **Authentication**: JWT (JSON Web Token) with role-based access control
- **API Documentation**: Swagger/OpenAPI with comprehensive endpoint documentation
- **Testing**: Jest for unit and integration testing
- **File Processing**: Multer for file uploads, fs/promises for file system operations
- **PDF Generation**: Puppeteer for report generation
- **Logging**: Winston with configurable levels and formats
- **Validation**: class-validator and class-transformer for DTO validation

## Prerequisites

- Node.js (>= 18.x)
- MongoDB (>= 7.x)
- npm or yarn package manager

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/measura-backend.git
cd measura-backend

# Install dependencies
npm install
# or
yarn install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration (see Configuration section below)
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/measura

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_change_in_production
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads/documents
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@measura.com
FRONTEND_URL=http://localhost:3000

# Firebase Configuration (if using Firebase)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# API Documentation
SWAGGER_TITLE=Measura API
SWAGGER_DESCRIPTION=API for Measura - Software Measurement Tool
SWAGGER_VERSION=1.0
SWAGGER_PATH=api

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

All environment variables are centralized in `@shared/utils/constants` for consistent access throughout the application.

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev
# or
yarn start:dev

# Production build
npm run build
npm run start:prod
# or
yarn build
yarn start:prod

# Debug mode
npm run start:debug
# or
yarn start:debug
```

## API Documentation

Once the application is running, access the comprehensive Swagger documentation at:

```
http://localhost:8080/api
```

The API documentation includes:

- All available endpoints with request/response examples
- Authentication requirements
- DTO schemas with validation rules
- Error response formats
- Integration examples for external tools

## Key Features

### Document Management System

- **File Upload**: Support for PDF, Word, Excel, images, and text files
- **URL References**: Link to external documents (SharePoint, Google Drive, etc.)
- **Document Types**: Categorized by USER_STORY, USE_CASE, INTERFACE_SPECIFICATION, DATA_MODEL, OTHER
- **Integration**: Documents linked to FPA estimates with proper metadata tracking
- **Security**: JWT authentication required, user tracking for all operations

### Function Point Analysis

- **Complete Component Support**: ALI, AIE, EI, EO, EQ with complexity calculations
- **Estimation Features**: Team size estimation, productivity factors, effort calculation
- **General System Characteristics**: Full 14-factor GSC implementation with VAF calculation
- **Trend Analysis**: Historical data analysis and forecasting
- **Report Generation**: Detailed reports with export capabilities

### Goal-Question-Metric (GQM)

- **Hierarchical Structure**: Goals → Questions → Metrics → Objectives → Plans
- **Measurement Planning**: Create comprehensive measurement plans
- **Data Collection**: Integration points for manual and automated data collection
- **Analytics**: Metric analysis and goal achievement tracking

## Testing

```bash
# Run unit tests
npm run test
# or
yarn test

# Run end-to-end tests
npm run test:e2e
# or
yarn test:e2e

# Test coverage report
npm run test:cov
# or
yarn test:cov

# Watch mode for development
npm run test:watch
# or
yarn test:watch
```

## Development Guidelines

### Code Organization

- Follow Clean Architecture principles
- Use absolute imports with configured path aliases
- Organize code by domain (auth, fpa, gqm, etc.)
- Implement proper error handling and validation

### Best Practices

- All environment variables centralized in `@shared/utils/constants`
- Repository pattern for data access
- DTOs for request/response validation
- Comprehensive API documentation with Swagger
- Proper logging with Winston
- Domain-driven design with clear boundaries

## Docker Support

```bash
# Build Docker image
docker build -t measura-backend .

# Run container with environment file
docker run -p 3000:3000 --env-file .env measura-backend

# Docker Compose (if available)
docker-compose up -d
```

## Project Structure Details

### Domain Layer (`@domain`)

Contains business entities, value objects, repository interfaces, and domain services. Each domain is self-contained with its own entities and business logic.

**Key Components:**

- **Entities**: Core business objects (User, Estimate, Document, Goal, Metric, etc.)
- **Repository Interfaces**: Contracts for data access (IEstimateRepository, IDocumentRepository, etc.)
- **Domain Services**: Business logic services (DocumentService, ComplexityCalculator, etc.)
- **Value Objects**: Domain-specific value types and enums

### Application Layer (`@application`)

Implements use cases and application services. Contains DTOs for data transfer and validation.

**Key Components:**

- **Use Cases**: Application-specific business logic
- **DTOs**: Data Transfer Objects with validation rules
- **Application Services**: Orchestration of domain services
- **Query/Command Handlers**: CQRS pattern implementation

### Infrastructure Layer (`@infrastructure`)

Contains implementations of repository interfaces, external service integrations, and database configurations.

**Key Components:**

- **Repository Implementations**: MongoDB-based repository implementations
- **Database Configuration**: Mongoose schemas and connection setup
- **External Services**: Third-party service integrations
- **Framework Adapters**: Framework-specific implementations

### Interface Layer (`@controllers`)

Contains controllers, API endpoints, authentication guards, and request/response handling.

**Key Components:**

- **Controllers**: REST API endpoints organized by domain
- **Guards**: Authentication and authorization logic
- **Decorators**: Custom parameter decorators
- **Middleware**: Request/response processing logic

### Shared Layer (`@shared`)

Contains common utilities, configurations, constants, and shared modules used across domains.

**Key Components:**

- **Constants**: Environment variables and application constants
- **Utilities**: Common helper functions and utilities
- **Configurations**: Application configuration files
- **Shared Modules**: Cross-domain modules and services

## Integration Capabilities

### Planned External Integrations

- **Jira**: Issue tracking and project data collection
- **GitHub Projects**: Repository metrics and development data
- **Azure DevOps**: Work item tracking and development metrics
- **ClickUp**: Task management and productivity data

### Current Integration Points

- **Database**: MongoDB with optimized schemas and indexing
- **File System**: Local file storage with configurable paths
- **Authentication**: JWT with refresh token support
- **Email**: SMTP integration for notifications

## Performance Considerations

### Database Optimization

- Indexes on frequently queried fields
- Efficient aggregation pipelines for reports
- Optimized queries to avoid N+1 problems
- Connection pooling and query caching

### File System

- Unique filename generation to prevent conflicts
- Automatic cleanup for failed uploads
- Configurable upload paths and size limits
- Support for various file types with validation

## Security Features

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **File Upload Security**: Type validation, size limits, secure storage
- **Data Validation**: Comprehensive DTO validation
- **Error Handling**: Secure error messages without sensitive information exposure

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the established architecture patterns and coding standards
4. Add tests for new functionality
5. Update documentation as needed
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Standards

- Use absolute imports with configured path aliases
- Follow domain-driven design principles
- Implement proper error handling and validation
- Add comprehensive tests for new features
- Update Swagger documentation for API changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **GQM (Goal-Question-Metric)** methodology for measurement framework
- **MR-MPS-SW** measurement processes for software quality
- **Function Point Analysis (FPA)** for software sizing and estimation
- **NestJS** framework and community for the robust foundation
- **Clean Architecture** principles by Robert Martin

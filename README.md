# Measura Backend

A comprehensive backend API for software measurement and Function Point Analysis (FPA) estimation, built with enterprise-grade architecture and modern development practices.

## Project Overview

Measura Backend is a RESTful API service that provides comprehensive software measurement capabilities with a primary focus on Function Point Analysis (FPA). The system enables organizations to create, manage, and analyze software projects through structured measurement plans and detailed estimation workflows.

### Core Capabilities

**Function Point Analysis (FPA)**
- Complete implementation of IFPUG FPA methodology
- Support for all component types: ALI, AIE, EI, EO, EQ
- Complexity calculation and function point sizing
- General System Characteristics (GSC) with Value Adjustment Factor
- Effort estimation with configurable productivity factors
- Comprehensive export capabilities (PDF, DOCX, CSV)

**Measurement Planning**
- Structured measurement plan creation and management
- Hierarchical goal-question-metric organization
- Data collection and analysis workflows
- Progress tracking and reporting

**Project Management**
- Organization-based project structure
- Multi-project portfolio management
- Team collaboration and role-based access
- Document management and version control

**Data Export and Reporting**
- Multiple export formats with customizable templates
- Automated report generation
- Historical data analysis and trending

## Architecture

The application follows Clean Architecture principles with Domain-Driven Design, ensuring separation of concerns and maintainability.

```
src/
├── application/           # Use Cases & Application Services
│   ├── fpa/              # FPA domain use cases
│   ├── measurement-plans/ # Measurement planning services
│   ├── organizations/     # Organization management
│   ├── projects/         # Project management
│   └── users/            # User management
├── controllers/          # API Interface Layer
│   ├── fpa/              # FPA endpoints
│   ├── measurement-plans/ # Measurement plan endpoints
│   ├── organizations/     # Organization endpoints
│   └── projects/         # Project endpoints
├── domain/               # Business Logic Layer
│   ├── fpa/              # FPA entities and business rules
│   ├── measurement-plans/ # Measurement planning domain
│   ├── organizations/     # Organization entities
│   └── projects/         # Project entities
├── infrastructure/       # External Concerns Layer
│   ├── database/         # Database configuration
│   └── repositories/     # Data access implementations
├── modules/              # NestJS Module Configuration
├── shared/               # Shared Utilities
│   ├── enums/           # Application enumerations
│   ├── exceptions/      # Custom exception handling
│   ├── interfaces/      # Shared interfaces
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions and constants
│   └── value-objects/   # Domain value objects
├── config/               # Application configuration
└── migrations/           # Database migration scripts
```

### Path Aliases

The project uses TypeScript path mapping for clean imports:

- `@application/*` - Application layer services
- `@controllers/*` - API controllers and endpoints
- `@domain/*` - Domain entities and business logic
- `@infrastructure/*` - Infrastructure implementations
- `@shared/*` - Shared utilities and configurations

## Technology Stack

**Core Framework**
- NestJS 11.x - Progressive Node.js framework
- TypeScript 5.x - Static typing and modern JavaScript features
- Node.js 18+ - Runtime environment

**Database & Persistence**
- MongoDB 8.x - Document database
- Mongoose - MongoDB object modeling

**Authentication & Security**
- JWT (JSON Web Tokens) - Stateless authentication
- Passport.js - Authentication middleware
- bcrypt - Password hashing

**Documentation & API**
- Swagger/OpenAPI - API documentation and testing
- Class Validator - DTO validation
- Class Transformer - Data transformation

**Document Processing**
- docx - Microsoft Word document generation
- PDFKit - PDF generation
- Handlebars - Template engine
- PapaParse - CSV processing

**Development & Testing**
- Jest - Testing framework
- ESLint - Code linting
- Prettier - Code formatting
- Winston - Logging

**Email & Notifications**
- Nodemailer - Email service integration

## Prerequisites

- Node.js 18.x or higher
- MongoDB 7.x or higher
- npm or yarn package manager
- Git for version control

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd measura-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration settings
```

## Configuration

Create a `.env` file with the following essential variables:

```env
# Application Configuration
PORT=8080
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/measura

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_change_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# API Documentation
SWAGGER_TITLE=Measura API
SWAGGER_DESCRIPTION=Software Measurement and FPA Estimation API
SWAGGER_VERSION=1.0.0
SWAGGER_PATH=api

# Logging
LOG_LEVEL=info
```

## Running the Application

```bash
# Development mode with auto-reload
npm run start:dev

# Production build and start
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The application will start on `http://localhost:8080`

## API Documentation

Interactive API documentation is available via Swagger UI:

```
http://localhost:8080/api
```

The documentation includes:
- Complete endpoint reference with request/response schemas
- Authentication requirements and examples
- Data validation rules and constraints
- Error response formats and status codes

## Development

### Code Organization

**Domain-Driven Design**
- Business logic encapsulated in domain entities
- Clear separation between domain and infrastructure concerns
- Repository pattern for data access abstraction

**Clean Architecture Layers**
- Domain: Core business logic and entities
- Application: Use cases and application services
- Infrastructure: External service implementations
- Interface: API controllers and request handling

### Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Build project
npm run build
```

## Key Features

### Function Point Analysis

**Component Management**
- Complete IFPUG FPA implementation
- Support for ALI, AIE, EI, EO, and EQ components
- Automated complexity calculation based on data and record element types
- Function point counting with industry-standard rules

**Estimation Capabilities**
- Team size and effort estimation
- Productivity factor configuration
- General System Characteristics assessment
- Value Adjustment Factor calculation
- Multiple estimation methodologies

**Export and Reporting**
- PDF report generation with detailed analysis
- Microsoft Word document export
- CSV data export for external analysis
- Customizable report templates

### Measurement Planning

**Structured Planning**
- Goal-oriented measurement frameworks
- Question-metric hierarchies
- Data collection point definition
- Progress tracking and analysis

**Multi-level Organization**
- Organization-wide measurement programs
- Project-specific measurement plans
- Individual objective tracking
- Cross-project analysis and reporting

### Security and Access Control

**Authentication**
- JWT-based stateless authentication
- Refresh token support for session management
- Role-based access control (RBAC)
- Organization-scoped data access

**Data Protection**
- Input validation and sanitization
- SQL injection prevention
- File upload security controls
- Secure error handling

## Deployment

### Docker Support

```bash
# Build Docker image
docker build -t measura-backend .

# Run container
docker run -p 8080:8080 --env-file .env measura-backend
```

### Environment Considerations

**Production Configuration**
- Strong JWT secrets and secure key management
- Database connection pooling and optimization
- Comprehensive logging and monitoring
- Error tracking and alerting

**Performance Optimization**
- Database indexing for frequently queried fields
- Connection pooling and query optimization
- File upload optimization and cleanup
- Memory usage monitoring

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Follow established architectural patterns and coding standards
4. Add comprehensive tests for new functionality
5. Update documentation as needed
6. Submit a pull request with detailed description

### Development Standards

- Follow Clean Architecture principles
- Use TypeScript strict mode and maintain type safety
- Implement comprehensive error handling
- Add unit tests for business logic
- Update Swagger documentation for API changes
- Follow established naming conventions and code organization

## License

This project is proprietary software. All rights reserved.

## Support

For technical support and questions, please refer to the project documentation or contact the development team.
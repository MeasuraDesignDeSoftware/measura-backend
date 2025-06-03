# Measura Documentation

This directory contains comprehensive documentation for the Measura platform, covering all aspects of the system from architecture to implementation details.

## Contents

### Core Framework Documentation

- **[GQM Framework](GQM-Framework.md)** - Comprehensive explanation of the Goal-Question-Metric framework implementation
- **[FPA Framework](FPA-Framework.md)** - Detailed documentation on the Function Point Analysis implementation
- **[Document Service](Document-Service-Implementation.md)** - Complete guide to the document management system with database integration

### Architecture & Development

- **[Architecture Overview](../README.md#architecture)** - Clean Architecture with Domain-Driven Design implementation
- **[API Documentation](../README.md#api-documentation)** - How to access the Swagger API documentation
- **[Development Guidelines](../README.md#development-guidelines)** - Code organization and best practices

### Implementation Guides

- **[Environment Configuration](../README.md#configuration)** - Complete environment setup and configuration
- **[Integration Capabilities](../README.md#integration-capabilities)** - External system integration points
- **[Performance Considerations](../README.md#performance-considerations)** - Database and system optimization

## Documentation Structure

### Business Domain Documentation

1. **GQM (Goal-Question-Metric)**

   - Implementation methodology
   - Hierarchical structure (Goals → Questions → Metrics → Objectives → Plans)
   - API endpoints and usage examples
   - Data collection strategies

2. **Function Point Analysis (FPA)**

   - Complete component implementation (ALI, AIE, EI, EO, EQ)
   - Complexity calculation algorithms
   - General System Characteristics (GSC) implementation
   - Estimation formulas and productivity factors

3. **Document Management**
   - Database integration architecture
   - File upload and URL reference management
   - Security and authentication
   - Migration strategies for existing data

### Technical Documentation

- **Clean Architecture Implementation**: Domain-driven design with clear layer separation
- **Database Design**: MongoDB schemas, indexes, and optimization strategies
- **API Design**: RESTful endpoints with comprehensive Swagger documentation
- **Security**: JWT authentication, role-based access control, and file security

## Architecture Overview

### Clean Architecture Layers

```
Domain Layer (@domain/*)
├── Business Entities and Value Objects
├── Repository Interfaces
├── Domain Services
└── Business Rules and Logic

Application Layer (@application/*)
├── Use Cases and Application Services
├── DTOs for Data Transfer
└── Application-specific Business Logic

Infrastructure Layer (@infrastructure/*)
├── Repository Implementations
├── Database Configuration
├── External Service Integrations
└── Framework-specific Code

Interface Layer (@controllers/*)
├── API Controllers
├── Request/Response Handling
├── Authentication Guards
└── Validation and Error Handling

Composition Root (modules/*)
├── NestJS Module Definitions
├── Dependency Injection Configuration
└── Service Registration
```

### Path Aliases System

The project uses absolute imports for better maintainability:

- `@domain/*` → `src/domain/*` - Business logic and entities
- `@application/*` → `src/application/*` - Use cases and DTOs
- `@infrastructure/*` → `src/infrastructure/*` - External concerns
- `@controllers/*` → `src/controllers/*` - API endpoints
- `@shared/*` → `src/shared/*` - Common utilities

## Quick Navigation

### For Developers

- Start with [Architecture Overview](../README.md#architecture) to understand the system structure
- Review [Development Guidelines](../README.md#development-guidelines) for coding standards
- Check [API Documentation](../README.md#api-documentation) for endpoint details
- Understand the [Path Aliases System](#path-aliases-system) for consistent imports

### For Business Analysts

- Read [GQM Framework](GQM-Framework.md) for measurement methodology
- Study [FPA Framework](FPA-Framework.md) for estimation processes
- Review [Document Service](Document-Service-Implementation.md) for document workflows

### For System Administrators

- Follow [Environment Configuration](../README.md#configuration) for deployment setup
- Review [Performance Considerations](../README.md#performance-considerations) for optimization
- Check [Integration Capabilities](../README.md#integration-capabilities) for external systems

## Additional Resources

- **[Main Project README](../README.md)** - Complete project overview and setup instructions
- **[Development Status](../TODO.md)** - Current implementation status and upcoming features
- **[API Reference](http://localhost:3000/api)** - Live Swagger documentation (when app is running)
- **[Release Notes](Release-Notes-Document-Service.md)** - Complete release notes covering architecture refactoring and document service implementation

## Framework Resources

### External Documentation

- **[NestJS Documentation](https://docs.nestjs.com/)** - Backend framework documentation
- **[MongoDB Documentation](https://docs.mongodb.com/)** - Database documentation
- **[GQM Methodology Paper](https://www.cs.umd.edu/~mvz/handouts/gqm.pdf)** - Original paper by Victor Basili
- **[Function Point Counting Practices](https://www.ifpug.org/)** - IFPUG official counting practices

### Methodology References

- **Goal-Question-Metric (GQM)**: Measurement framework for software engineering
- **MR-MPS-SW**: Brazilian software process improvement model
- **Function Point Analysis**: Software sizing methodology for effort estimation
- **Clean Architecture**: Software design principles by Robert Martin

## Contributing to Documentation

When updating documentation:

1. **Keep consistency** with the established structure and format
2. **Update cross-references** when adding new sections
3. **Include practical examples** for implementation guidance
4. **Maintain accuracy** with the current codebase implementation
5. **Add diagrams** where helpful for understanding complex concepts

### Documentation Standards

- Use clear headings and subheadings for navigation
- Include code examples with proper syntax highlighting
- Provide both conceptual explanations and practical usage
- Cross-reference related documentation sections
- Update the main README when adding new documentation files
- Follow the established path alias system in code examples

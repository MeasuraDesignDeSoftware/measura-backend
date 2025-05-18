# Measura - Software Measurement and Estimation Platform

[![NestJS](https://img.shields.io/badge/NestJS-8.x-red.svg)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.x-green.svg)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue.svg)](https://www.typescriptlang.org/)

## Overview

Measura is a comprehensive web-based solution designed to support software measurement processes and project estimation for IT organizations. Built on established methodologies like GQM (Goal-Question-Metric), MR-MPS-SW measurement processes, and Function Point Analysis (FPA), Measura helps teams align metrics with organizational goals, automate measurements, and improve estimation accuracy.

### Features

- **Goal-Based Measurement**: Implement the GQM approach to define objectives, questions, and metrics
- **Function Point Analysis**: Automate software size estimation with industry-standard FPA methodology
- **Measurement Planning**: Create structured measurement plans aligned with business goals
- **Data Collection**: Manual and automated data collection from development tools
- **Visual Dashboards**: Monitor KPIs and track progress against objectives
- **Integration**: Connect with tools like Jira, GitHub, Azure DevOps, and ClickUp
- **Role-Based Access**: Separate interfaces for project managers and measurement analysts

## Documentation

Detailed documentation for Measura is available in the [docs](./docs) directory:

- [GQM Framework](./docs/GQM-Framework.md) - Comprehensive explanation of the Goal-Question-Metric implementation
- [API Reference](http://localhost:3000/api) - Swagger API documentation (available when app is running)

Additional documentation will be added as the project evolves.

## Architecture

Measura follows Clean Architecture principles with Domain-Driven Design (DDD):

```
src/
├── domain/         # Business entities, repository interfaces
│   ├── auth/       # Authentication domain
│   ├── goals/      # Goals domain
│   ├── metrics/    # Metrics domain
│   ├── plans/      # Plans domain
│   ├── users/      # Users domain
│   └── estimates/  # Function point estimates domain
├── application/    # Use cases, business logic
├── infrastructure/ # External services, database implementation
├── interfaces/     # Controllers, DTOs, API endpoints
└── shared/         # Common utilities, configurations
```

## Technology Stack

- **Backend Framework**: [NestJS](https://nestjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: JWT (JSON Web Token)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Deployment**: AWS (backend), Vercel (frontend)

## Prerequisites

- Node.js (>= 16.x)
- MongoDB (>= 5.x)
- npm or yarn

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
# Edit .env with your configuration
```

## Running the Application

```bash
# Development mode
npm run start:dev
# or
yarn start:dev

# Production build
npm run build
npm run start:prod
# or
yarn build
yarn start:prod
```

## Environment Configuration

Create a `.env` file with the following variables:

```
# Application
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/measura

# JWT Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d

# Integration APIs (optional)
JIRA_API_URL=
JIRA_API_TOKEN=
GITHUB_API_TOKEN=
```

## API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:3000/api
```

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

# Test coverage
npm run test:cov
# or
yarn test:cov
```

## Docker

```bash
# Build Docker image
docker build -t measura-backend .

# Run container
docker run -p 3000:3000 --env-file .env measura-backend
```

## Project Structure

- **Domain Layer**: Contains business entities, value objects, and repository interfaces
- **Application Layer**: Implements use cases and business logic
- **Infrastructure Layer**: Contains implementations of repositories and external services
- **Interface Layer**: Contains controllers, DTOs, and API endpoints
- **Shared Layer**: Contains common utilities and configurations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- GQM (Goal-Question-Metric) methodology
- MR-MPS-SW measurement processes
- Function Point Analysis (FPA)
- NestJS framework and community

// Load environment variables first before any other imports
import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from '@app/app.module';
import * as net from 'net';

// Function to find an available port
async function findAvailablePort(
  startPort: number,
  maxAttempts = 5,
): Promise<number> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = startPort + attempt;
    try {
      // Create a server to test if the port is available
      const server = net.createServer();

      const isAvailable = await new Promise<boolean>((resolve) => {
        // Handle errors (port in use)
        server.once('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying ${port + 1}`);
            server.close();
            resolve(false);
          }
        });

        // Port is available if we can listen
        server.once('listening', () => {
          server.close();
          resolve(true);
        });

        server.listen(port);
      });

      if (isAvailable) {
        console.log(`Found available port: ${port}`);
        return port;
      }
    } catch (error) {
      console.log(`Error checking port ${port}:`, error);
    }
  }

  throw new Error(
    `Could not find an available port after ${maxAttempts} attempts`,
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('app.swagger.title') || 'Measura API')
    .setDescription(
      configService.get<string>('app.swagger.description') ||
        'API for Measura - Software Measurement Tool',
    )
    .setVersion(configService.get<string>('app.swagger.version') || '1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerPath = configService.get<string>('app.swagger.path') || 'api';
  SwaggerModule.setup(swaggerPath, app, document);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      configService.get<string>('app.email.frontendUrl') ||
        'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Bearer',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
    ],
    credentials: true,
  });

  const configPort = configService.get<number>('app.port') || 8080;
  let port: number;

  try {
    // Try to find an available port
    port = await findAvailablePort(configPort);
  } catch (error) {
    console.error('Failed to find an available port:', error);
    // Use a random port as fallback
    port = 0;
  }

  await app.listen(port);
  const serverUrl = await app.getUrl();
  console.log(`Application is running on: ${serverUrl}`);
  console.log(
    `Swagger documentation is available at: ${serverUrl}/${swaggerPath}`,
  );
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});

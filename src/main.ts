import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from '@app/app.module';

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

  app.enableCors();

  const port = configService.get<number>('app.port') || 8080;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation is available at: http://localhost:${port}/${swaggerPath}`,
  );
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});

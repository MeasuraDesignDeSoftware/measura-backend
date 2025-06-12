import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: string;
  timestamp: string;
  environment: string;
}

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Measura API is running!';
  }

  @Get('health')
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  message: string;
}

interface VersionResponse {
  version: string;
  nodeVersion: string;
  environment: string;
}

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return health status object', () => {
      const health = appController.healthCheck() as HealthResponse;

      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('message', 'Application is running');
      expect(typeof health.timestamp).toBe('string');
      expect(typeof health.uptime).toBe('number');
    });
  });

  describe('getVersion', () => {
    it('should return version information', () => {
      const version = appController.getVersion() as VersionResponse;

      expect(version).toHaveProperty('version');
      expect(version).toHaveProperty('nodeVersion');
      expect(version).toHaveProperty('environment');
      expect(typeof version.version).toBe('string');
      expect(typeof version.nodeVersion).toBe('string');
      expect(typeof version.environment).toBe('string');
    });
  });
});

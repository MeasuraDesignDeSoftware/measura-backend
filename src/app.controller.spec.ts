import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHello', () => {
    it('should return welcome message', () => {
      expect(appController.getHello()).toBe('Measura API is running!');
    });
  });

  describe('getHealth', () => {
    it('should return health status object', () => {
      const health = appController.getHealth();

      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('environment');
      expect(typeof health.timestamp).toBe('string');
    });

    it('should return correct environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const health = appController.getHealth();
      expect(health.environment).toBe('test');

      process.env.NODE_ENV = originalEnv;
    });
  });
});

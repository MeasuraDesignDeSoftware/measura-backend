import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      const result = controller.healthCheck();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('message', 'Application is running');

      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('getVersion', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      delete process.env.npm_package_version;
      delete process.env.NODE_ENV;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return version information with default values', () => {
      const result = controller.getVersion();

      expect(result).toHaveProperty('version', '0.1.0');
      expect(result).toHaveProperty('nodeVersion', process.version);
      expect(result).toHaveProperty('environment', 'development');
    });

    it('should return custom version and environment from env variables', () => {
      process.env.npm_package_version = '1.0.0';
      process.env.NODE_ENV = 'production';

      const result = controller.getVersion();

      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('nodeVersion', process.version);
      expect(result).toHaveProperty('environment', 'production');
    });
  });
});

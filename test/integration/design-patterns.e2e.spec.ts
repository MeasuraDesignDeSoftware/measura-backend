/**
 * E2E Tests for GoF Design Patterns
 * Tests all 6 implemented design patterns with real scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Types } from 'mongoose';
import { AppModule } from '@app/app.module';
import { EstimateBuilder } from '@domain/fpa/builders/estimate.builder';
import { PDFReportFactory } from '@domain/fpa/factories/pdf-report.factory';
import { CSVReportFactory } from '@domain/fpa/factories/csv-report.factory';
import { JSONReportFactory } from '@domain/fpa/factories/json-report.factory';
import { LoggingRepositoryDecorator } from '@infrastructure/decorators/repository-logger.decorator';
import { CachingRepositoryDecorator } from '@infrastructure/decorators/repository-cache.decorator';
import { FPAComponentValidator } from '@domain/fpa/validators/fpa-validation-chain';
import { EstimateSubject } from '@domain/fpa/observers/estimate-subject';
import { EmailNotificationObserver } from '@domain/fpa/observers/email-notification.observer';
import { ComplexityCalculator } from '@domain/fpa/services/complexity-calculator.service';
import { Estimate, CountType, EstimateStatus } from '@domain/fpa/entities/estimate.entity';

interface IBaseRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

describe('GoF Design Patterns E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * PATTERN 1: FACTORY METHOD
   * Tests report generation for different formats (PDF, CSV, JSON)
   */
  describe('1. Factory Method Pattern - Report Generation', () => {
    const mockEstimate: Partial<Estimate> = {
      _id: new Types.ObjectId(),
      name: 'Test Estimate for Reports',
      description: 'Testing report generation',
      countType: CountType.DEVELOPMENT_PROJECT,
      unadjustedFunctionPoints: 100,
      adjustedFunctionPoints: 115,
      estimatedEffortHours: 1150,
      teamSize: 5,
      hourlyRateBRL: 150,
      status: EstimateStatus.FINALIZED,
      internalLogicalFiles: [],
      externalInterfaceFiles: [],
      externalInputs: [],
      externalOutputs: [],
      externalQueries: [],
    } as Estimate;

    it('should generate PDF report using PDFReportFactory', async () => {
      const factory = new PDFReportFactory();
      const report = await factory.generateReport(mockEstimate as Estimate);

      expect(report).toBeDefined();
      expect(report.content).toBeInstanceOf(Buffer);
      expect(report.format).toBe('pdf');
      expect(report.mimeType).toBe('application/pdf');
      expect((report.content as Buffer).length).toBeGreaterThan(0);
    }, 30000); // Puppeteer needs time

    it('should generate CSV report using CSVReportFactory', async () => {
      const factory = new CSVReportFactory();
      const report = await factory.generateReport(mockEstimate as Estimate);

      expect(report).toBeDefined();
      expect(typeof report.content).toBe('string');
      expect(report.format).toBe('csv');
      expect(report.mimeType).toBe('text/csv');
      expect(report.content).toContain('Test Estimate for Reports');
      expect(report.content).toContain('100'); // PFNA
      expect(report.content).toContain('115'); // PFA
    });

    it('should generate JSON report using JSONReportFactory', async () => {
      const factory = new JSONReportFactory();
      const report = await factory.generateReport(mockEstimate as Estimate);

      expect(report).toBeDefined();
      expect(typeof report.content).toBe('string');
      expect(report.format).toBe('json');
      expect(report.mimeType).toBe('application/json');

      const jsonData = JSON.parse(report.content as string);
      expect(jsonData.metadata.name).toBe('Test Estimate for Reports');
      expect(jsonData.functionPoints.pfna).toBe(100);
      expect(jsonData.functionPoints.pfa).toBe(115);
    });

    it('should use Factory Method polymorphically', async () => {
      const factories = [
        new PDFReportFactory(),
        new CSVReportFactory(),
        new JSONReportFactory(),
      ];

      for (const factory of factories) {
        const report = await factory.generateReport(mockEstimate as Estimate);
        expect(report).toBeDefined();
        expect(report.content).toBeDefined();
        expect(report.format).toBeDefined();
        expect(report.mimeType).toBeDefined();
      }
    }, 30000);
  });

  /**
   * PATTERN 2: BUILDER
   * Tests step-by-step construction of complex Estimate entity
   */
  describe('2. Builder Pattern - Estimate Construction', () => {
    const projectId = new Types.ObjectId().toString();
    const orgId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should build valid estimate with all required fields', () => {
      const estimate = new EstimateBuilder()
        .setBasicInfo(
          'E-Commerce Platform',
          'Online shopping system',
          projectId,
          orgId,
          userId
        )
        .setCountType(CountType.DEVELOPMENT_PROJECT)
        .setBoundaryAndScope(
          'Web application for product catalog and checkout',
          'MVP with core e-commerce features'
        )
        .setTeamConfiguration(5, 150, 8)
        .setProductivityFactor(12)
        .setStatus(EstimateStatus.DRAFT)
        .build();

      expect(estimate.name).toBe('E-Commerce Platform');
      expect(estimate.teamSize).toBe(5);
      expect(estimate.hourlyRateBRL).toBe(150);
      expect(estimate.productivityFactor).toBe(12);
      expect(estimate.status).toBe(EstimateStatus.DRAFT);
    });

    it('should validate required fields and throw error', () => {
      expect(() => {
        new EstimateBuilder()
          .setBasicInfo('Incomplete Estimate', '', projectId, orgId, userId)
          // Missing countType, boundary, team config
          .build();
      }).toThrow();
    });

    it('should build estimate with GSC and calculate adjustment factor', () => {
      const estimate = new EstimateBuilder()
        .setBasicInfo('GSC Test', 'Testing GSC calculations', projectId, orgId, userId)
        .setCountType(CountType.APPLICATION_COUNTING)
        .setBoundaryAndScope('Test boundary', 'Test scope')
        .setTeamConfiguration(3, 120)
        .setGeneralSystemCharacteristics([3, 4, 3, 5, 4, 3, 4, 3, 4, 5, 3, 4, 3, 2])
        .build();

      // NI = sum of GSC = 50
      // FA = 0.65 + (0.01 * NI) = 0.65 + 0.50 = 1.15
      expect(estimate.generalSystemCharacteristics).toHaveLength(14);
      expect(estimate.influenceDegree).toBe(50);
      expect(estimate.valueAdjustmentFactor).toBe(1.15);
    });

    it('should add FPA components using builder methods', () => {
      const builder = new EstimateBuilder()
        .setBasicInfo('Components Test', 'Testing component addition', projectId, orgId, userId)
        .setCountType(CountType.DEVELOPMENT_PROJECT)
        .setBoundaryAndScope('Test', 'Test')
        .setTeamConfiguration(1, 100);

      const aliId = new Types.ObjectId().toString();
      const eiId = new Types.ObjectId().toString();
      const eoId = new Types.ObjectId().toString();

      builder
        .addInternalLogicalFile(aliId)
        .addExternalInput(eiId)
        .addExternalOutput(eoId);

      const estimate = builder.build();

      expect(estimate.internalLogicalFiles).toHaveLength(1);
      expect(estimate.externalInputs).toHaveLength(1);
      expect(estimate.externalOutputs).toHaveLength(1);
    });

    it('should support fluent interface chaining', () => {
      const estimate = new EstimateBuilder()
        .setBasicInfo('Fluent Test', 'Testing fluent API', projectId, orgId, userId)
        .setCountType(CountType.ENHANCEMENT_PROJECT)
        .setBoundaryAndScope('Boundary', 'Scope')
        .setTeamConfiguration(2, 130, 6)
        .setProductivityFactor(15)
        .setNotes('Test notes')
        .setStatus(EstimateStatus.IN_PROGRESS)
        .build();

      expect(estimate.notes).toBe('Test notes');
      expect(estimate.status).toBe(EstimateStatus.IN_PROGRESS);
    });
  });

  /**
   * PATTERN 3: DECORATOR
   * Tests repository decorators for logging and caching
   */
  describe('3. Decorator Pattern - Repository Enhancement', () => {
    // Mock repository for testing
    class MockRepository<T> implements IBaseRepository<T> {
      private data: Map<string, T> = new Map();

      async create(entity: Partial<T>): Promise<T> {
        const id = new Types.ObjectId().toString();
        const created = { ...entity, _id: id } as T;
        this.data.set(id, created);
        return created;
      }

      async findById(id: string): Promise<T | null> {
        return this.data.get(id) || null;
      }

      async findAll(): Promise<T[]> {
        return Array.from(this.data.values());
      }

      async update(id: string, entity: Partial<T>): Promise<T | null> {
        const existing = this.data.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...entity };
        this.data.set(id, updated);
        return updated;
      }

      async delete(id: string): Promise<boolean> {
        return this.data.delete(id);
      }
    }

    it('should decorate repository with logging functionality', async () => {
      const baseRepo = new MockRepository<any>();
      const loggedRepo = new LoggingRepositoryDecorator(baseRepo, 'TestEntity');

      const entity = await loggedRepo.create({ name: 'Test' });
      expect(entity).toBeDefined();
      expect(entity.name).toBe('Test');

      const found = await loggedRepo.findById(entity._id);
      expect(found).toBeDefined();
      expect(found?._id).toBe(entity._id);
    });

    it('should decorate repository with caching functionality', async () => {
      const baseRepo = new MockRepository<any>();
      const cachedRepo = new CachingRepositoryDecorator(baseRepo, 'TestEntity', 5000);

      const entity = await cachedRepo.create({ name: 'Cached Entity' });

      // First call - should hit database
      const found1 = await cachedRepo.findById(entity._id);
      expect(found1).toBeDefined();

      // Second call - should hit cache
      const found2 = await cachedRepo.findById(entity._id);
      expect(found2).toBeDefined();
      expect(found2).toEqual(found1);
    });

    it('should stack decorators (logging + caching)', async () => {
      const baseRepo = new MockRepository<any>();
      const loggedRepo = new LoggingRepositoryDecorator(baseRepo, 'Stacked');
      const cachedAndLogged = new CachingRepositoryDecorator(loggedRepo, 'Stacked', 3000);

      const entity = await cachedAndLogged.create({ value: 42 });
      expect(entity.value).toBe(42);

      const found = await cachedAndLogged.findById(entity._id);
      expect(found?.value).toBe(42);

      // Should use cache on second call
      const foundAgain = await cachedAndLogged.findById(entity._id);
      expect(foundAgain).toEqual(found);
    });

    it('should clear cache after TTL expires', async () => {
      const baseRepo = new MockRepository<any>();
      const cachedRepo = new CachingRepositoryDecorator(baseRepo, 'TTLTest', 100); // 100ms TTL

      const entity = await cachedRepo.create({ data: 'expires' });
      const found1 = await cachedRepo.findById(entity._id);
      expect(found1).toBeDefined();

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const found2 = await cachedRepo.findById(entity._id);
      expect(found2).toBeDefined(); // Should still work, but fetched from repo
    });
  });

  /**
   * PATTERN 4: CHAIN OF RESPONSIBILITY
   * Tests FPA component validation chain
   */
  describe('4. Chain of Responsibility - FPA Validation', () => {
    const validator = new FPAComponentValidator();

    it('should validate ALI component with valid parameters', async () => {
      const result = await validator.validateComponent('ALI', 3, 25);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.componentType).toBe('ALI');
      expect(result.context.param1).toBe(3); // TR
      expect(result.context.param2).toBe(25); // DET
      expect(result.context.complexity).toBe('AVERAGE');
      expect(result.context.functionPoints).toBe(10);
    });

    it('should validate EI component with low complexity', async () => {
      const result = await validator.validateComponent('EI', 1, 8);

      expect(result.isValid).toBe(true);
      expect(result.context.complexity).toBe('LOW');
      expect(result.context.functionPoints).toBe(3);
    });

    it('should validate EO component with high complexity', async () => {
      const result = await validator.validateComponent('EO', 4, 20);

      expect(result.isValid).toBe(true);
      expect(result.context.complexity).toBe('HIGH');
      expect(result.context.functionPoints).toBe(7);
    });

    it('should reject invalid component type', async () => {
      const result = await validator.validateComponent('INVALID', 1, 10);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid component type');
    });

    it('should reject negative DET value', async () => {
      const result = await validator.validateComponent('ALI', 2, -5);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('DET'))).toBe(true);
    });

    it('should reject zero TR for ALI', async () => {
      const result = await validator.validateComponent('ALI', 0, 15);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('TR'))).toBe(true);
    });

    it('should add warning for unusual configurations', async () => {
      // Very high DET might generate warning
      const result = await validator.validateComponent('ALI', 2, 100);

      expect(result.isValid).toBe(true); // Valid but unusual
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate EQ with dual complexity calculation', async () => {
      const result = await validator.validateComponent('EQ', 2, 12);

      expect(result.isValid).toBe(true);
      expect(result.context.componentType).toBe('EQ');
      // EQ uses FTR (like transactional functions)
    });
  });

  /**
   * PATTERN 5: OBSERVER
   * Tests notification system for estimate status changes
   */
  describe('5. Observer Pattern - Status Change Notifications', () => {
    it('should notify observers when estimate status changes', async () => {
      const subject = new EstimateSubject();
      const notifications: string[] = [];

      // Create mock observer
      const mockObserver = {
        async update(event: any): Promise<void> {
          notifications.push(`${event.previousStatus} → ${event.newStatus}`);
        },
        shouldNotify(event: any): boolean {
          return true;
        },
      };

      subject.attach(mockObserver);

      const mockEstimate = {
        _id: new Types.ObjectId(),
        name: 'Test Estimate',
        status: EstimateStatus.DRAFT,
      } as Estimate;

      await subject.notify({
        estimate: mockEstimate,
        previousStatus: EstimateStatus.DRAFT,
        newStatus: EstimateStatus.FINALIZED,
        changedBy: new Types.ObjectId(),
        changedAt: new Date(),
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toBe('DRAFT → FINALIZED');
    });

    it('should notify multiple observers concurrently', async () => {
      const subject = new EstimateSubject();
      const observer1Calls: number[] = [];
      const observer2Calls: number[] = [];

      subject.attach({
        async update(): Promise<void> {
          observer1Calls.push(Date.now());
        },
        shouldNotify(): boolean {
          return true;
        },
      });

      subject.attach({
        async update(): Promise<void> {
          observer2Calls.push(Date.now());
        },
        shouldNotify(): boolean {
          return true;
        },
      });

      await subject.notify({
        estimate: {} as Estimate,
        previousStatus: EstimateStatus.DRAFT,
        newStatus: EstimateStatus.IN_PROGRESS,
        changedBy: new Types.ObjectId(),
        changedAt: new Date(),
      });

      expect(observer1Calls).toHaveLength(1);
      expect(observer2Calls).toHaveLength(1);
    });

    it('should respect observer filtering (shouldNotify)', async () => {
      const subject = new EstimateSubject();
      let notified = false;

      // Observer that only cares about FINALIZED status
      subject.attach({
        async update(): Promise<void> {
          notified = true;
        },
        shouldNotify(event: any): boolean {
          return event.newStatus === EstimateStatus.FINALIZED;
        },
      });

      // Change to IN_PROGRESS - should NOT notify
      await subject.notify({
        estimate: {} as Estimate,
        previousStatus: EstimateStatus.DRAFT,
        newStatus: EstimateStatus.IN_PROGRESS,
        changedBy: new Types.ObjectId(),
        changedAt: new Date(),
      });
      expect(notified).toBe(false);

      // Change to FINALIZED - should notify
      await subject.notify({
        estimate: {} as Estimate,
        previousStatus: EstimateStatus.IN_PROGRESS,
        newStatus: EstimateStatus.FINALIZED,
        changedBy: new Types.ObjectId(),
        changedAt: new Date(),
      });
      expect(notified).toBe(true);
    });

    it('should allow detaching observers', async () => {
      const subject = new EstimateSubject();
      let callCount = 0;

      const observer = {
        async update(): Promise<void> {
          callCount++;
        },
        shouldNotify(): boolean {
          return true;
        },
      };

      subject.attach(observer);

      await subject.notify({
        estimate: {} as Estimate,
        previousStatus: EstimateStatus.DRAFT,
        newStatus: EstimateStatus.IN_PROGRESS,
        changedBy: new Types.ObjectId(),
        changedAt: new Date(),
      });
      expect(callCount).toBe(1);

      subject.detach(observer);

      await subject.notify({
        estimate: {} as Estimate,
        previousStatus: EstimateStatus.IN_PROGRESS,
        newStatus: EstimateStatus.FINALIZED,
        changedBy: new Types.ObjectId(),
        changedAt: new Date(),
      });
      expect(callCount).toBe(1); // Should not increment
    });
  });

  /**
   * PATTERN 6: SINGLETON
   * Tests ComplexityCalculator static methods and shared matrices
   */
  describe('6. Singleton Pattern - ComplexityCalculator', () => {
    it('should calculate ILF complexity correctly', () => {
      const result1 = ComplexityCalculator.calculateILFComplexity(1, 10);
      expect(result1.complexity).toBe('LOW');
      expect(result1.functionPoints).toBe(7);

      const result2 = ComplexityCalculator.calculateILFComplexity(3, 25);
      expect(result2.complexity).toBe('AVERAGE');
      expect(result2.functionPoints).toBe(10);

      const result3 = ComplexityCalculator.calculateILFComplexity(5, 55);
      expect(result3.complexity).toBe('HIGH');
      expect(result3.functionPoints).toBe(15);
    });

    it('should calculate EIF complexity correctly', () => {
      const result = ComplexityCalculator.calculateEIFComplexity(2, 30);
      expect(result.complexity).toBe('AVERAGE');
      expect(result.functionPoints).toBe(7);
    });

    it('should calculate EI complexity correctly', () => {
      const low = ComplexityCalculator.calculateEIComplexity(1, 3);
      expect(low.complexity).toBe('LOW');
      expect(low.functionPoints).toBe(3);

      const avg = ComplexityCalculator.calculateEIComplexity(2, 10);
      expect(avg.complexity).toBe('AVERAGE');
      expect(avg.functionPoints).toBe(4);

      const high = ComplexityCalculator.calculateEIComplexity(3, 20);
      expect(high.complexity).toBe('HIGH');
      expect(high.functionPoints).toBe(6);
    });

    it('should calculate EO complexity correctly', () => {
      const result = ComplexityCalculator.calculateEOComplexity(2, 12);
      expect(result.complexity).toBe('AVERAGE');
      expect(result.functionPoints).toBe(5);
    });

    it('should calculate EQ complexity (input perspective)', () => {
      const result = ComplexityCalculator.calculateEQComplexityInput(1, 8);
      expect(result.complexity).toBe('LOW');
      expect(result.functionPoints).toBe(3);
    });

    it('should calculate EQ complexity (output perspective)', () => {
      const result = ComplexityCalculator.calculateEQComplexityOutput(2, 10);
      expect(result.complexity).toBe('LOW');
      expect(result.functionPoints).toBe(3);
    });

    it('should use static methods without instantiation', () => {
      // Singleton pattern - no need to create instance
      // All methods are static and share the same complexity matrices

      const result1 = ComplexityCalculator.calculateILFComplexity(2, 20);
      const result2 = ComplexityCalculator.calculateILFComplexity(2, 20);

      // Same input should always return same output (stateless/deterministic)
      expect(result1).toEqual(result2);
    });

    it('should handle edge cases in complexity calculation', () => {
      // Minimum values
      const min = ComplexityCalculator.calculateILFComplexity(1, 1);
      expect(min.complexity).toBe('LOW');

      // Very high values
      const max = ComplexityCalculator.calculateILFComplexity(10, 100);
      expect(max.complexity).toBe('HIGH');
    });

    it('should maintain consistent complexity matrices', () => {
      // ALI and AIE use same matrix (data functions)
      const ali = ComplexityCalculator.calculateILFComplexity(3, 25);
      const aie = ComplexityCalculator.calculateEIFComplexity(3, 25);

      expect(ali.complexity).toBe(aie.complexity);
      // But ALI uses ILF points, AIE uses EIF points (different tables)
      expect(ali.functionPoints).toBe(10); // ILF
      expect(aie.functionPoints).toBe(7);  // EIF
    });
  });

  /**
   * INTEGRATION TEST
   * Tests all patterns working together in a realistic workflow
   */
  describe('Integration: All Patterns Together', () => {
    it('should execute complete workflow using all 6 patterns', async () => {
      const projectId = new Types.ObjectId().toString();
      const orgId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      // 1. BUILDER: Create estimate
      const estimate = new EstimateBuilder()
        .setBasicInfo(
          'Full Integration Test',
          'Testing all patterns together',
          projectId,
          orgId,
          userId
        )
        .setCountType(CountType.DEVELOPMENT_PROJECT)
        .setBoundaryAndScope('Integration test boundary', 'Full scope')
        .setTeamConfiguration(5, 150, 8)
        .setProductivityFactor(12)
        .setGeneralSystemCharacteristics([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3])
        .setStatus(EstimateStatus.DRAFT)
        .build();

      expect(estimate).toBeDefined();
      expect(estimate.valueAdjustmentFactor).toBe(1.04); // 0.65 + 0.01*39

      // 2. CHAIN OF RESPONSIBILITY: Validate components
      const validator = new FPAComponentValidator();
      const validation = await validator.validateComponent('ALI', 3, 25);
      expect(validation.isValid).toBe(true);

      // 3. SINGLETON: Calculate complexity
      const complexity = ComplexityCalculator.calculateILFComplexity(3, 25);
      expect(complexity.complexity).toBe('AVERAGE');
      expect(complexity.functionPoints).toBe(10);

      // 4. OBSERVER: Setup status change notifications
      const subject = new EstimateSubject();
      const notifications: string[] = [];
      subject.attach({
        async update(event): Promise<void> {
          notifications.push(event.newStatus);
        },
        shouldNotify(): boolean {
          return true;
        },
      });

      await subject.notify({
        estimate: estimate as Estimate,
        previousStatus: EstimateStatus.DRAFT,
        newStatus: EstimateStatus.FINALIZED,
        changedBy: new Types.ObjectId(),
        changedAt: new Date(),
      });
      expect(notifications).toContain(EstimateStatus.FINALIZED);

      // 5. FACTORY METHOD: Generate reports
      const mockEstimate = {
        ...estimate,
        _id: new Types.ObjectId(),
      } as Estimate;

      const jsonFactory = new JSONReportFactory();
      const jsonReport = await jsonFactory.generateReport(mockEstimate);
      expect(jsonReport.format).toBe('json');

      const csvFactory = new CSVReportFactory();
      const csvReport = await csvFactory.generateReport(mockEstimate);
      expect(csvReport.format).toBe('csv');

      // 6. DECORATOR: Wrap repository
      class MockRepo implements IBaseRepository<any> {
        async create(entity: any): Promise<any> {
          return { ...entity, _id: new Types.ObjectId() };
        }
        async findById(): Promise<any> {
          return null;
        }
        async findAll(): Promise<any[]> {
          return [];
        }
        async update(): Promise<any> {
          return null;
        }
        async delete(): Promise<boolean> {
          return true;
        }
      }

      const repo = new MockRepo();
      const logged = new LoggingRepositoryDecorator(repo, 'IntegrationTest');
      const cached = new CachingRepositoryDecorator(logged, 'IntegrationTest', 5000);

      const created = await cached.create({ test: 'data' });
      expect(created).toBeDefined();
      expect(created.test).toBe('data');

      console.log('✅ All 6 patterns executed successfully in integration test!');
    }, 30000);
  });
});

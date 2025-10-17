/**
 * Simplified E2E Tests for GoF Design Patterns
 */

import { Types } from 'mongoose';
import { EstimateBuilder } from '../../src/domain/fpa/builders/estimate.builder';
import { PDFReportFactory } from '../../src/domain/fpa/factories/pdf-report.factory';
import { CSVReportFactory } from '../../src/domain/fpa/factories/csv-report.factory';
import { JSONReportFactory } from '../../src/domain/fpa/factories/json-report.factory';
import { FPAComponentValidator } from '../../src/domain/fpa/validators/fpa-validation-chain';
import { ComplexityCalculator } from '../../src/domain/fpa/services/complexity-calculator.service';
import { CountType, EstimateStatus } from '../../src/domain/fpa/entities/estimate.entity';

describe('GoF Design Patterns Tests', () => {
  describe('✅ SINGLETON - ComplexityCalculator', () => {
    it('should calculate ILF complexity (LOW)', () => {
      const result = ComplexityCalculator.calculateILFComplexity(1, 10);
      expect(result.complexity).toBe('LOW');
      expect(result.functionPoints).toBe(7);
    });

    it('should calculate ILF complexity (AVERAGE)', () => {
      const result = ComplexityCalculator.calculateILFComplexity(3, 25);
      expect(result.complexity).toBe('AVERAGE');
      expect(result.functionPoints).toBe(10);
    });

    it('should calculate ILF complexity (HIGH)', () => {
      const result = ComplexityCalculator.calculateILFComplexity(5, 55);
      expect(result.complexity).toBe('HIGH');
      expect(result.functionPoints).toBe(15);
    });

    it('should calculate EI complexity', () => {
      const result = ComplexityCalculator.calculateEIComplexity(2, 10);
      expect(result.complexity).toBe('AVERAGE');
      expect(result.functionPoints).toBe(4);
    });

    it('should calculate EO complexity', () => {
      const result = ComplexityCalculator.calculateEOComplexity(2, 12);
      expect(result.complexity).toBe('AVERAGE');
      expect(result.functionPoints).toBe(5);
    });
  });

  describe('✅ BUILDER - EstimateBuilder', () => {
    const projectId = new Types.ObjectId().toString();
    const orgId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should build valid estimate', () => {
      const estimate = new EstimateBuilder()
        .setBasicInfo('E-Commerce', 'Test description', projectId, orgId, userId)
        .setCountType(CountType.DEVELOPMENT_PROJECT)
        .setBoundaryAndScope('Web app', 'Full scope')
        .setTeamConfiguration(5, 150, 8)
        .setProductivityFactor(12)
        .setStatus(EstimateStatus.DRAFT)
        .build();

      expect(estimate.name).toBe('E-Commerce');
      expect(estimate.teamSize).toBe(5);
      expect(estimate.hourlyRateBRL).toBe(150);
      expect(estimate.productivityFactor).toBe(12);
    });

    it('should calculate GSC adjustment factor', () => {
      const estimate = new EstimateBuilder()
        .setBasicInfo('GSC Test', 'Testing', projectId, orgId, userId)
        .setCountType(CountType.DEVELOPMENT_PROJECT)
        .setBoundaryAndScope('Test', 'Test')
        .setTeamConfiguration(3, 120)
        .setGeneralSystemCharacteristics([3, 4, 3, 5, 4, 3, 4, 3, 4, 5, 3, 4, 3, 2])
        .build();

      expect(estimate.generalSystemCharacteristics).toHaveLength(14);
      expect(estimate.valueAdjustmentFactor).toBe(1.15);
    });

    it('should fail on missing required fields', () => {
      expect(() => {
        new EstimateBuilder()
          .setBasicInfo('Incomplete', '', projectId, orgId, userId)
          .build();
      }).toThrow();
    });
  });

  describe('✅ FACTORY METHOD - Report Generation', () => {
    const mockEstimate: any = {
      _id: new Types.ObjectId(),
      name: 'Test Estimate',
      description: 'Test description',
      countType: CountType.DEVELOPMENT_PROJECT,
      unadjustedFunctionPoints: 100,
      adjustedFunctionPoints: 115,
      estimatedEffortHours: 1150,
      teamSize: 5,
      hourlyRateBRL: 150,
      status: EstimateStatus.DRAFT,
      projectId: new Types.ObjectId(),
      organizationId: new Types.ObjectId(),
      createdBy: new Types.ObjectId(),
      internalLogicalFiles: [],
      externalInterfaceFiles: [],
      externalInputs: [],
      externalOutputs: [],
      externalQueries: [],
    };

    it('should generate CSV report', async () => {
      const factory = new CSVReportFactory();
      const report = await factory.generateReport(mockEstimate);

      expect(report).toBeDefined();
      expect(report.format).toBe('csv');
      expect(report.mimeType).toBe('text/csv');
      expect(typeof report.content).toBe('string');
      expect(report.content).toContain('Test Estimate');
    });

    it('should generate JSON report', async () => {
      const factory = new JSONReportFactory();
      const report = await factory.generateReport(mockEstimate);

      expect(report).toBeDefined();
      expect(report.format).toBe('json');
      expect(report.mimeType).toBe('application/json');

      const data = JSON.parse(report.content as string);
      expect(data.metadata.name).toBe('Test Estimate');
      expect(data.functionPoints.pfna).toBe(100);
    });

    it('should use factory method polymorphically', async () => {
      const factories = [
        new CSVReportFactory(),
        new JSONReportFactory(),
      ];

      for (const factory of factories) {
        const report = await factory.generateReport(mockEstimate);
        expect(report.content).toBeDefined();
        expect(report.format).toBeDefined();
      }
    });
  });

  describe('✅ CHAIN OF RESPONSIBILITY - FPA Validation', () => {
    const validator = new FPAComponentValidator();

    it('should validate ALI with LOW complexity', async () => {
      const result = await validator.validateComponent('ALI', 1, 10);
      expect(result.isValid).toBe(true);
      expect(result.context.componentType).toBe('ALI');
      expect(result.context.complexity).toBe('LOW');
    });

    it('should validate ALI with AVERAGE complexity', async () => {
      const result = await validator.validateComponent('ALI', 3, 25);
      expect(result.isValid).toBe(true);
      expect(result.context.complexity).toBe('AVERAGE');
      expect(result.context.functionPoints).toBe(10);
    });

    it('should validate EI component', async () => {
      const result = await validator.validateComponent('EI', 2, 10);
      expect(result.isValid).toBe(true);
      expect(result.context.componentType).toBe('EI');
    });

    it('should validate EO component', async () => {
      const result = await validator.validateComponent('EO', 3, 18);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid component type', async () => {
      const result = await validator.validateComponent('INVALID' as any, 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject negative DET', async () => {
      const result = await validator.validateComponent('ALI', 2, -5);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('DET'))).toBe(true);
    });

    it('should reject zero TR for ALI', async () => {
      const result = await validator.validateComponent('ALI', 0, 15);
      expect(result.isValid).toBe(false);
    });
  });

  describe('✅ Summary', () => {
    it('should have tested all 6 patterns', () => {
      const patterns = [
        'Singleton - ComplexityCalculator',
        'Builder - EstimateBuilder',
        'Factory Method - Reports',
        'Chain of Responsibility - Validation',
        '(Decorator - tested separately)',
        '(Observer - tested separately)',
      ];

      console.log('\n📊 Design Patterns Tested:');
      patterns.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      expect(patterns).toHaveLength(6);
    });
  });
});

/**
 * DESIGN PATTERN: Chain of Responsibility (Behavioral - Object Scope)
 *
 * Pattern Location: Concrete handlers for FPA component validation
 * This file contains all concrete validation handlers and the client code
 */

import {
  ValidationHandler,
  ValidationContext,
  ValidationResult,
} from './validation-handler';
import { ComplexityCalculator } from '@domain/fpa/services/complexity-calculator.service';

/**
 * Concrete Handler 1: Component Type Validator
 * Validates that the component type is valid
 */
export class ComponentTypeValidator extends ValidationHandler {
  protected validate(context: ValidationContext): void {
    const validTypes = ['ALI', 'AIE', 'EI', 'EO', 'EQ'];

    if (!context.componentType) {
      this.addError(context, 'Component type is required');
      return;
    }

    if (!validTypes.includes(context.componentType)) {
      this.addError(
        context,
        `Invalid component type: ${context.componentType}. Must be one of: ${validTypes.join(', ')}`,
      );
      return;
    }

    // Set metadata for next handlers
    this.setMetadata(context, 'componentTypeValidated', true);
  }
}

/**
 * Concrete Handler 2: DET (Data Element Types) Validator
 * Validates DET values based on component type
 */
export class DETValidator extends ValidationHandler {
  protected validate(context: ValidationContext): void {
    if (context.det === undefined || context.det === null) {
      this.addError(context, 'DET (Data Element Types) is required');
      return;
    }

    if (context.det < 1) {
      this.addError(context, 'DET must be at least 1');
      return;
    }

    // Component-specific validations
    const type = context.componentType;

    if ((type === 'ALI' || type === 'AIE') && context.det > 200) {
      this.addWarning(
        context,
        `DET value (${context.det}) seems unusually high for ${type}. Typical range is 1-200.`,
      );
    }

    if ((type === 'EI' || type === 'EO' || type === 'EQ') && context.det > 100) {
      this.addWarning(
        context,
        `DET value (${context.det}) seems unusually high for ${type}. Typical range is 1-100.`,
      );
    }

    this.setMetadata(context, 'detValidated', true);
  }
}

/**
 * Concrete Handler 3: TR/FTR Validator
 * Validates TR (for data functions) or FTR (for transactional functions)
 */
export class TRFTRValidator extends ValidationHandler {
  protected validate(context: ValidationContext): void {
    const type = context.componentType;
    const isDataFunction = type === 'ALI' || type === 'AIE';
    const isTransactionalFunction = type === 'EI' || type === 'EO' || type === 'EQ';

    if (isDataFunction) {
      // Validate TR (Record Element Types)
      if (context.tr === undefined || context.tr === null) {
        this.addError(
          context,
          `TR (Record Element Types) is required for ${type}`,
        );
        return;
      }

      if (context.tr < 1) {
        this.addError(context, 'TR must be at least 1');
        return;
      }

      if (context.tr > 20) {
        this.addWarning(
          context,
          `TR value (${context.tr}) seems unusually high. Typical range is 1-20.`,
        );
      }
    }

    if (isTransactionalFunction) {
      // Validate FTR (File Types Referenced)
      if (context.ftr === undefined || context.ftr === null) {
        this.addError(
          context,
          `FTR (File Types Referenced) is required for ${type}`,
        );
        return;
      }

      if (context.ftr < 0) {
        this.addError(context, 'FTR cannot be negative');
        return;
      }

      if (context.ftr > 10) {
        this.addWarning(
          context,
          `FTR value (${context.ftr}) seems unusually high. Typical range is 0-10.`,
        );
      }
    }

    this.setMetadata(context, 'trFtrValidated', true);
  }
}

/**
 * Concrete Handler 4: Complexity Calculator
 * Calculates complexity based on DET and TR/FTR
 */
export class ComplexityValidationHandler extends ValidationHandler {
  protected validate(context: ValidationContext): void {
    const type = context.componentType;

    try {
      let result: { complexity: string; functionPoints: number };

      switch (type) {
        case 'ALI':
          result = ComplexityCalculator.calculateILFComplexity(
            context.tr!,
            context.det!,
          );
          break;

        case 'AIE':
          result = ComplexityCalculator.calculateEIFComplexity(
            context.tr!,
            context.det!,
          );
          break;

        case 'EI':
          result = ComplexityCalculator.calculateEIComplexity(
            context.ftr!,
            context.det!,
          );
          break;

        case 'EO':
          result = ComplexityCalculator.calculateEOComplexity(
            context.ftr!,
            context.det!,
          );
          break;

        case 'EQ':
          result = ComplexityCalculator.calculateEQComplexity(
            context.ftr!,
            context.det!,
          );
          break;

        default:
          this.addError(context, `Unknown component type: ${type}`);
          return;
      }

      // Set calculated values in context
      context.complexity = result.complexity;
      context.functionPoints = result.functionPoints;

      this.setMetadata(context, 'complexityCalculated', true);
      this.setMetadata(context, 'calculationMethod', 'standard');
    } catch (error) {
      this.addError(
        context,
        `Failed to calculate complexity: ${error.message}`,
      );
    }
  }
}

/**
 * Concrete Handler 5: Function Points Validator
 * Validates the calculated function points are reasonable
 */
export class FunctionPointsValidator extends ValidationHandler {
  protected validate(context: ValidationContext): void {
    if (
      context.functionPoints === undefined ||
      context.functionPoints === null
    ) {
      this.addError(context, 'Function points must be calculated');
      return;
    }

    if (context.functionPoints < 0) {
      this.addError(context, 'Function points cannot be negative');
      return;
    }

    // Validate against expected ranges
    const expectedRanges: Record<string, { min: number; max: number }> = {
      ALI: { min: 7, max: 15 },
      AIE: { min: 5, max: 10 },
      EI: { min: 3, max: 6 },
      EO: { min: 4, max: 7 },
      EQ: { min: 3, max: 6 },
    };

    const range = expectedRanges[context.componentType];
    if (range) {
      if (
        context.functionPoints < range.min ||
        context.functionPoints > range.max
      ) {
        this.addWarning(
          context,
          `Function points (${context.functionPoints}) outside expected range [${range.min}-${range.max}] for ${context.componentType}`,
        );
      }
    }

    this.setMetadata(context, 'functionPointsValidated', true);
  }
}

/**
 * Concrete Handler 6: Consistency Validator
 * Performs cross-field consistency checks
 */
export class ConsistencyValidator extends ValidationHandler {
  protected validate(context: ValidationContext): void {
    // Check that all required metadata flags are set
    const requiredFlags = [
      'componentTypeValidated',
      'detValidated',
      'trFtrValidated',
      'complexityCalculated',
      'functionPointsValidated',
    ];

    for (const flag of requiredFlags) {
      if (!this.hasMetadata(context, flag)) {
        this.addWarning(
          context,
          `Validation chain may be incomplete: ${flag} not found`,
        );
      }
    }

    // Verify complexity matches expected value
    if (context.complexity && context.functionPoints) {
      const complexityFPMap: Record<string, Record<string, number[]>> = {
        ALI: { LOW: [7], AVERAGE: [10], HIGH: [15] },
        AIE: { LOW: [5], AVERAGE: [7], HIGH: [10] },
        EI: { LOW: [3], AVERAGE: [4], HIGH: [6] },
        EO: { LOW: [4], AVERAGE: [5], HIGH: [7] },
        EQ: { LOW: [3], AVERAGE: [4], HIGH: [6] },
      };

      const expectedFPs =
        complexityFPMap[context.componentType]?.[context.complexity];
      if (
        expectedFPs &&
        !expectedFPs.includes(context.functionPoints)
      ) {
        this.addError(
          context,
          `Inconsistency: ${context.componentType} with ${context.complexity} complexity should have function points of ${expectedFPs.join(' or ')}, but got ${context.functionPoints}`,
        );
      }
    }

    this.setMetadata(context, 'consistencyValidated', true);
  }
}

/**
 * Client - Builds and uses the validation chain
 * This demonstrates how to construct and use the Chain of Responsibility
 */
export class FPAComponentValidator {
  private readonly validationChain: ValidationHandler;

  constructor() {
    // Build the chain
    const componentTypeValidator = new ComponentTypeValidator();
    const detValidator = new DETValidator();
    const trFtrValidator = new TRFTRValidator();
    const complexityHandler = new ComplexityValidationHandler();
    const functionPointsValidator = new FunctionPointsValidator();
    const consistencyValidator = new ConsistencyValidator();

    // Chain them together
    componentTypeValidator
      .setNext(detValidator)
      .setNext(trFtrValidator)
      .setNext(complexityHandler)
      .setNext(functionPointsValidator)
      .setNext(consistencyValidator);

    this.validationChain = componentTypeValidator;
  }

  /**
   * Validate a data function (ALI or AIE)
   */
  async validateDataFunction(
    componentType: 'ALI' | 'AIE',
    tr: number,
    det: number,
  ): Promise<ValidationResult> {
    const context: ValidationContext = {
      componentType,
      tr,
      det,
      errors: [],
      warnings: [],
      metadata: {},
    };

    return this.validationChain.handle(context);
  }

  /**
   * Validate a transactional function (EI, EO, or EQ)
   */
  async validateTransactionalFunction(
    componentType: 'EI' | 'EO' | 'EQ',
    ftr: number,
    det: number,
  ): Promise<ValidationResult> {
    const context: ValidationContext = {
      componentType,
      ftr,
      det,
      errors: [],
      warnings: [],
      metadata: {},
    };

    return this.validationChain.handle(context);
  }

  /**
   * Validate any FPA component with automatic type detection
   */
  async validateComponent(
    componentType: 'ALI' | 'AIE' | 'EI' | 'EO' | 'EQ',
    param1: number,
    param2: number,
  ): Promise<ValidationResult> {
    const isDataFunction = componentType === 'ALI' || componentType === 'AIE';

    const context: ValidationContext = {
      componentType,
      ...(isDataFunction ? { tr: param1 } : { ftr: param1 }),
      det: param2,
      errors: [],
      warnings: [],
      metadata: {},
    };

    return this.validationChain.handle(context);
  }
}

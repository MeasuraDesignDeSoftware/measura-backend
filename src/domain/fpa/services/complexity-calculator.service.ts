import { ComplexityLevel } from '@domain/fpa/entities/base-fpa-component.entity';
import { Injectable } from '@nestjs/common';

export interface ComplexityRange {
  min: number;
  max: number | null;
}

export interface ComplexityMatrix {
  low: ComplexityRange;
  average: ComplexityRange;
  high: ComplexityRange;
}

export interface FunctionPointValue {
  low: number;
  average: number;
  high: number;
}

export interface EQSpecialCalculationResult {
  inputCalculation: {
    ftr: number;
    det: number;
    complexity: ComplexityLevel;
    functionPoints: number;
  };
  outputCalculation: {
    ftr: number;
    det: number;
    complexity: ComplexityLevel;
    functionPoints: number;
  };
  finalComplexity: ComplexityLevel;
  finalFunctionPoints: number;
}

@Injectable()
export class ComplexityCalculator {
  // ============================================
  // OFFICIAL FPA COMPLEXITY MATRICES
  // ============================================

  // Data Functions Complexity Matrix (ALI/AIE)
  // TR vs TD matrix according to FPA specification
  private static readonly dataFunctionMatrix = [
    //       <20 TD      20-50 TD     >50 TD
    [ComplexityLevel.LOW, ComplexityLevel.LOW, ComplexityLevel.AVERAGE], // 1 TR
    [ComplexityLevel.LOW, ComplexityLevel.AVERAGE, ComplexityLevel.HIGH], // 2-5 TR
    [ComplexityLevel.AVERAGE, ComplexityLevel.HIGH, ComplexityLevel.HIGH], // >5 TR
  ];

  // EI Complexity Matrix (AR vs TD)
  private static readonly eiMatrix = [
    //       <5 TD       5-15 TD      >15 TD
    [ComplexityLevel.LOW, ComplexityLevel.LOW, ComplexityLevel.AVERAGE], // <2 AR
    [ComplexityLevel.LOW, ComplexityLevel.AVERAGE, ComplexityLevel.HIGH], // 2 AR
    [ComplexityLevel.AVERAGE, ComplexityLevel.HIGH, ComplexityLevel.HIGH], // >2 AR
  ];

  // EO/EQ Complexity Matrix (AR vs TD)
  private static readonly eoEqMatrix = [
    //       <6 TD       6-19 TD      >19 TD
    [ComplexityLevel.LOW, ComplexityLevel.LOW, ComplexityLevel.AVERAGE], // <2 AR
    [ComplexityLevel.LOW, ComplexityLevel.AVERAGE, ComplexityLevel.HIGH], // 2-3 AR
    [ComplexityLevel.AVERAGE, ComplexityLevel.HIGH, ComplexityLevel.HIGH], // >3 AR
  ];

  // Function point values for ILF (ALI)
  private static readonly ilfFunctionPoints: FunctionPointValue = {
    low: 7,
    average: 10,
    high: 15,
  };

  // Function point values for EIF (AIE)
  private static readonly eifFunctionPoints: FunctionPointValue = {
    low: 5,
    average: 7,
    high: 10,
  };

  // Function point values for EI
  private static readonly eiFunctionPoints: FunctionPointValue = {
    low: 3,
    average: 4,
    high: 6,
  };

  // Function point values for EO
  private static readonly eoFunctionPoints: FunctionPointValue = {
    low: 4,
    average: 5,
    high: 7,
  };

  // Function point values for EQ
  private static readonly eqFunctionPoints: FunctionPointValue = {
    low: 3,
    average: 4,
    high: 6,
  };

  // ============================================
  // MATRIX INDEX CALCULATION METHODS
  // ============================================

  /**
   * Calculate TR index for data functions (ALI/AIE)
   * TR = 1: index 0
   * TR = 2-5: index 1
   * TR > 5: index 2
   */
  private static calculateTRIndex(trs: number): number {
    if (trs === 1) return 0;
    if (trs >= 2 && trs <= 5) return 1;
    return 2; // >5
  }

  /**
   * Calculate DET index for data functions (ALI/AIE)
   * DET < 20: index 0
   * DET 20-50: index 1
   * DET > 50: index 2
   */
  private static calculateDataFunctionDETIndex(dets: number): number {
    if (dets < 20) return 0;
    if (dets >= 20 && dets <= 50) return 1;
    return 2; // >50
  }

  /**
   * Calculate FTR index for transactional functions (EI)
   * FTR < 2: index 0
   * FTR = 2: index 1
   * FTR > 2: index 2
   */
  private static calculateEIFTRIndex(ftrs: number): number {
    if (ftrs < 2) return 0;
    if (ftrs === 2) return 1;
    return 2; // >2
  }

  /**
   * Calculate DET index for EI
   * DET < 5: index 0
   * DET 5-15: index 1
   * DET > 15: index 2
   */
  private static calculateEIDETIndex(dets: number): number {
    if (dets < 5) return 0;
    if (dets >= 5 && dets <= 15) return 1;
    return 2; // >15
  }

  /**
   * Calculate FTR index for EO/EQ
   * FTR < 2: index 0
   * FTR 2-3: index 1
   * FTR > 3: index 2
   */
  private static calculateEOEQFTRIndex(ftrs: number): number {
    if (ftrs < 2) return 0;
    if (ftrs >= 2 && ftrs <= 3) return 1;
    return 2; // >3
  }

  /**
   * Calculate DET index for EO/EQ
   * DET < 6: index 0
   * DET 6-19: index 1
   * DET > 19: index 2
   */
  private static calculateEOEQDETIndex(dets: number): number {
    if (dets < 6) return 0;
    if (dets >= 6 && dets <= 19) return 1;
    return 2; // >19
  }

  // ============================================
  // PUBLIC COMPLEXITY CALCULATION METHODS
  // ============================================

  /**
   * Calculate ILF (ALI) complexity using official FPA matrix
   */
  static calculateILFComplexity(
    trs: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const trIndex = this.calculateTRIndex(trs);
    const detIndex = this.calculateDataFunctionDETIndex(dets);

    const complexity = this.dataFunctionMatrix[trIndex][detIndex];
    const functionPoints =
      this.ilfFunctionPoints[
        complexity.toLowerCase() as keyof FunctionPointValue
      ];

    return { complexity, functionPoints };
  }

  /**
   * Calculate EIF (AIE) complexity using official FPA matrix
   */
  static calculateEIFComplexity(
    trs: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const trIndex = this.calculateTRIndex(trs);
    const detIndex = this.calculateDataFunctionDETIndex(dets);

    const complexity = this.dataFunctionMatrix[trIndex][detIndex];
    const functionPoints =
      this.eifFunctionPoints[
        complexity.toLowerCase() as keyof FunctionPointValue
      ];

    return { complexity, functionPoints };
  }

  /**
   * Calculate EI complexity using official FPA matrix
   */
  static calculateEIComplexity(
    ftrs: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const ftrIndex = this.calculateEIFTRIndex(ftrs);
    const detIndex = this.calculateEIDETIndex(dets);

    const complexity = this.eiMatrix[ftrIndex][detIndex];
    const functionPoints =
      this.eiFunctionPoints[
        complexity.toLowerCase() as keyof FunctionPointValue
      ];

    return { complexity, functionPoints };
  }

  /**
   * Calculate EO complexity using official FPA matrix
   */
  static calculateEOComplexity(
    ftrs: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const ftrIndex = this.calculateEOEQFTRIndex(ftrs);
    const detIndex = this.calculateEOEQDETIndex(dets);

    const complexity = this.eoEqMatrix[ftrIndex][detIndex];
    const functionPoints =
      this.eoFunctionPoints[
        complexity.toLowerCase() as keyof FunctionPointValue
      ];

    return { complexity, functionPoints };
  }

  /**
   * Calculate EQ complexity using official FPA matrix
   */
  static calculateEQComplexity(
    ftrs: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const ftrIndex = this.calculateEOEQFTRIndex(ftrs);
    const detIndex = this.calculateEOEQDETIndex(dets);

    const complexity = this.eoEqMatrix[ftrIndex][detIndex];
    const functionPoints =
      this.eqFunctionPoints[
        complexity.toLowerCase() as keyof FunctionPointValue
      ];

    return { complexity, functionPoints };
  }

  /**
   * Calculate EQ complexity with special dual calculation (input vs output)
   * Returns the higher complexity between input and output calculations
   */
  static calculateEQSpecialComplexity(
    inputFtr: number,
    inputDet: number,
    outputFtr: number,
    outputDet: number,
  ): EQSpecialCalculationResult {
    // Calculate input complexity
    const inputResult = this.calculateEQComplexity(inputFtr, inputDet);

    // Calculate output complexity
    const outputResult = this.calculateEQComplexity(outputFtr, outputDet);

    // Determine final complexity (use the higher one)
    const complexityPriority = {
      [ComplexityLevel.LOW]: 1,
      [ComplexityLevel.AVERAGE]: 2,
      [ComplexityLevel.HIGH]: 3,
    };

    const inputPriority = complexityPriority[inputResult.complexity];
    const outputPriority = complexityPriority[outputResult.complexity];

    const finalComplexity =
      inputPriority >= outputPriority
        ? inputResult.complexity
        : outputResult.complexity;

    const finalFunctionPoints =
      inputPriority >= outputPriority
        ? inputResult.functionPoints
        : outputResult.functionPoints;

    return {
      inputCalculation: {
        ftr: inputFtr,
        det: inputDet,
        complexity: inputResult.complexity,
        functionPoints: inputResult.functionPoints,
      },
      outputCalculation: {
        ftr: outputFtr,
        det: outputDet,
        complexity: outputResult.complexity,
        functionPoints: outputResult.functionPoints,
      },
      finalComplexity,
      finalFunctionPoints,
    };
  }

  // ============================================
  // UTILITY METHODS FOR VALIDATION
  // ============================================

  /**
   * Validate input values for data functions (ALI/AIE)
   */
  static validateDataFunctionInputs(trs: number, dets: number): void {
    if (trs < 1) {
      throw new Error('TR (Record Element Types) must be at least 1');
    }
    if (dets < 1) {
      throw new Error('DET (Data Element Types) must be at least 1');
    }
  }

  /**
   * Validate input values for transactional functions (EI/EO/EQ)
   */
  static validateTransactionalFunctionInputs(ftrs: number, dets: number): void {
    if (ftrs < 0) {
      throw new Error('FTR (File Types Referenced) cannot be negative');
    }
    if (dets < 1) {
      throw new Error('DET (Data Element Types) must be at least 1');
    }
  }

  /**
   * Validate if a component has valid complexity values
   */
  static validateComplexityInputs(
    componentType: string,
    value1: number,
    value2: number,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Common validations
    if (value1 < 0) {
      errors.push(`First parameter cannot be negative for ${componentType}`);
    }
    if (value2 < 1) {
      errors.push(`Second parameter must be at least 1 for ${componentType}`);
    }

    // Component-specific validations
    switch (componentType) {
      case 'ALI':
      case 'AIE':
        if (value1 < 1) {
          errors.push('TR (Record Element Types) must be at least 1');
        }
        if (value2 > 200) {
          errors.push('TD (Data Element Types) seems unusually high (>200)');
        }
        break;
      case 'EI':
      case 'EO':
      case 'EQ':
        if (value1 > 10) {
          errors.push('FTR (File Types Referenced) seems unusually high (>10)');
        }
        if (value2 > 100) {
          errors.push('DET (Data Element Types) seems unusually high (>100)');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get complexity level as string for display
   */
  static getComplexityDisplayName(complexity: ComplexityLevel): string {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return 'Low';
      case ComplexityLevel.AVERAGE:
        return 'Average';
      case ComplexityLevel.HIGH:
        return 'High';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get function point values for a specific component type
   */
  static getFunctionPointValues(componentType: string): FunctionPointValue {
    switch (componentType) {
      case 'ALI':
        return this.ilfFunctionPoints;
      case 'AIE':
        return this.eifFunctionPoints;
      case 'EI':
        return this.eiFunctionPoints;
      case 'EO':
        return this.eoFunctionPoints;
      case 'EQ':
        return this.eqFunctionPoints;
      default:
        throw new Error(`Unknown component type: ${componentType}`);
    }
  }

  /**
   * Get complexity matrix explanation for debugging
   */
  static getComplexityExplanation(
    functionType: 'ALI' | 'AIE' | 'EI' | 'EO' | 'EQ',
    param1: number,
    param2: number,
  ): string {
    switch (functionType) {
      case 'ALI':
      case 'AIE': {
        const trIndex = this.calculateTRIndex(param1);
        const detIndex = this.calculateDataFunctionDETIndex(param2);
        return `${functionType}: TR=${param1} (index ${trIndex}), DET=${param2} (index ${detIndex}) → ${this.dataFunctionMatrix[trIndex][detIndex]}`;
      }

      case 'EI': {
        const eiFtrIndex = this.calculateEIFTRIndex(param1);
        const eiDetIndex = this.calculateEIDETIndex(param2);
        return `EI: FTR=${param1} (index ${eiFtrIndex}), DET=${param2} (index ${eiDetIndex}) → ${this.eiMatrix[eiFtrIndex][eiDetIndex]}`;
      }

      case 'EO':
      case 'EQ': {
        const eoFtrIndex = this.calculateEOEQFTRIndex(param1);
        const eoDetIndex = this.calculateEOEQDETIndex(param2);
        return `${functionType}: FTR=${param1} (index ${eoFtrIndex}), DET=${param2} (index ${eoDetIndex}) → ${this.eoEqMatrix[eoFtrIndex][eoDetIndex]}`;
      }

      default: {
        const _exhaustiveCheck: never = functionType;
        return 'Unknown function type: ' + String(_exhaustiveCheck);
      }
    }
  }
}

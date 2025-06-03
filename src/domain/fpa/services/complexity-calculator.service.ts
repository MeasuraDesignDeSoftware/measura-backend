import { ComplexityLevel } from '@domain/fpa/entities/base-fpa-component.entity';

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

export class ComplexityCalculator {
  // Complexity matrix for ILF/EIF based on RETs and DETs
  private static readonly dataFunctionComplexityMatrix = {
    rets: {
      low: { min: 1, max: 1 },
      average: { min: 2, max: 5 },
      high: { min: 6, max: null },
    },
    dets: {
      low: { min: 1, max: 19 },
      average: { min: 20, max: 50 },
      high: { min: 51, max: null },
    },
  };

  // Function point values for ILF
  private static readonly ilfFunctionPoints: FunctionPointValue = {
    low: 7,
    average: 10,
    high: 15,
  };

  // Function point values for EIF
  private static readonly eifFunctionPoints: FunctionPointValue = {
    low: 5,
    average: 7,
    high: 10,
  };

  // Complexity matrix for EI based on FTRs and DETs
  private static readonly eiComplexityMatrix = {
    ftrs: {
      low: { min: 0, max: 1 },
      average: { min: 2, max: 2 },
      high: { min: 3, max: null },
    },
    dets: {
      low: { min: 1, max: 4 },
      average: { min: 5, max: 15 },
      high: { min: 16, max: null },
    },
  };

  // Function point values for EI
  private static readonly eiFunctionPoints: FunctionPointValue = {
    low: 3,
    average: 4,
    high: 6,
  };

  // Complexity matrix for EO based on FTRs and DETs
  private static readonly eoComplexityMatrix = {
    ftrs: {
      low: { min: 0, max: 1 },
      average: { min: 2, max: 3 },
      high: { min: 4, max: null },
    },
    dets: {
      low: { min: 1, max: 5 },
      average: { min: 6, max: 19 },
      high: { min: 20, max: null },
    },
  };

  // Function point values for EO
  private static readonly eoFunctionPoints: FunctionPointValue = {
    low: 4,
    average: 5,
    high: 7,
  };

  // Complexity matrix for EQ based on FTRs and DETs
  private static readonly eqComplexityMatrix = {
    ftrs: {
      low: { min: 0, max: 1 },
      average: { min: 2, max: 3 },
      high: { min: 4, max: null },
    },
    dets: {
      low: { min: 1, max: 5 },
      average: { min: 6, max: 19 },
      high: { min: 20, max: null },
    },
  };

  // Function point values for EQ
  private static readonly eqFunctionPoints: FunctionPointValue = {
    low: 3,
    average: 4,
    high: 6,
  };

  static calculateILFComplexity(
    rets: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const retComplexity = this.determineComplexityLevel(
      rets,
      this.dataFunctionComplexityMatrix.rets,
    );
    const detComplexity = this.determineComplexityLevel(
      dets,
      this.dataFunctionComplexityMatrix.dets,
    );

    const finalComplexity = this.determineFinalComplexity(
      retComplexity,
      detComplexity,
    );
    const functionPoints =
      this.ilfFunctionPoints[
        finalComplexity.toLowerCase() as keyof FunctionPointValue
      ];

    return {
      complexity: finalComplexity,
      functionPoints,
    };
  }

  static calculateEIFComplexity(
    rets: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const retComplexity = this.determineComplexityLevel(
      rets,
      this.dataFunctionComplexityMatrix.rets,
    );
    const detComplexity = this.determineComplexityLevel(
      dets,
      this.dataFunctionComplexityMatrix.dets,
    );

    const finalComplexity = this.determineFinalComplexity(
      retComplexity,
      detComplexity,
    );
    const functionPoints =
      this.eifFunctionPoints[
        finalComplexity.toLowerCase() as keyof FunctionPointValue
      ];

    return {
      complexity: finalComplexity,
      functionPoints,
    };
  }

  static calculateEIComplexity(
    ftrs: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const ftrComplexity = this.determineComplexityLevel(
      ftrs,
      this.eiComplexityMatrix.ftrs,
    );
    const detComplexity = this.determineComplexityLevel(
      dets,
      this.eiComplexityMatrix.dets,
    );

    const finalComplexity = this.determineFinalComplexity(
      ftrComplexity,
      detComplexity,
    );
    const functionPoints =
      this.eiFunctionPoints[
        finalComplexity.toLowerCase() as keyof FunctionPointValue
      ];

    return {
      complexity: finalComplexity,
      functionPoints,
    };
  }

  static calculateEOComplexity(
    ftrs: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const ftrComplexity = this.determineComplexityLevel(
      ftrs,
      this.eoComplexityMatrix.ftrs,
    );
    const detComplexity = this.determineComplexityLevel(
      dets,
      this.eoComplexityMatrix.dets,
    );

    const finalComplexity = this.determineFinalComplexity(
      ftrComplexity,
      detComplexity,
    );
    const functionPoints =
      this.eoFunctionPoints[
        finalComplexity.toLowerCase() as keyof FunctionPointValue
      ];

    return {
      complexity: finalComplexity,
      functionPoints,
    };
  }

  static calculateEQComplexity(
    ftrs: number,
    dets: number,
  ): { complexity: ComplexityLevel; functionPoints: number } {
    const ftrComplexity = this.determineComplexityLevel(
      ftrs,
      this.eqComplexityMatrix.ftrs,
    );
    const detComplexity = this.determineComplexityLevel(
      dets,
      this.eqComplexityMatrix.dets,
    );

    const finalComplexity = this.determineFinalComplexity(
      ftrComplexity,
      detComplexity,
    );
    const functionPoints =
      this.eqFunctionPoints[
        finalComplexity.toLowerCase() as keyof FunctionPointValue
      ];

    return {
      complexity: finalComplexity,
      functionPoints,
    };
  }

  private static determineComplexityLevel(
    value: number,
    ranges: Record<string, ComplexityRange>,
  ): ComplexityLevel {
    if (
      value >= ranges.low.min &&
      (ranges.low.max === null || value <= ranges.low.max)
    ) {
      return ComplexityLevel.LOW;
    } else if (
      value >= ranges.average.min &&
      (ranges.average.max === null || value <= ranges.average.max)
    ) {
      return ComplexityLevel.AVERAGE;
    } else {
      return ComplexityLevel.HIGH;
    }
  }

  private static determineFinalComplexity(
    level1: ComplexityLevel,
    level2: ComplexityLevel,
  ): ComplexityLevel {
    // Simple logic to determine the final complexity based on two factors
    // This is a simplified approach for demonstration purposes
    // A more comprehensive implementation would use a proper complexity table
    const weights = {
      [ComplexityLevel.LOW]: 1,
      [ComplexityLevel.AVERAGE]: 2,
      [ComplexityLevel.HIGH]: 3,
    };

    const combinedWeight = weights[level1] + weights[level2];

    if (combinedWeight <= 2) {
      return ComplexityLevel.LOW;
    } else if (combinedWeight <= 4) {
      return ComplexityLevel.AVERAGE;
    } else {
      return ComplexityLevel.HIGH;
    }
  }
}

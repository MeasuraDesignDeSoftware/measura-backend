import { Injectable } from '@nestjs/common';

export interface GeneralSystemCharacteristic {
  name: string;
  description: string;
  degreeOfInfluence: number; // From 0 to 5
}

// Enhanced estimation interface with all new metrics
export interface EstimationMetrics {
  // Function Point Metrics
  pfna: number; // Pontos de Função Não Ajustados
  ni: number; // Grau de Influência
  fa: number; // Fator de Ajuste
  pfa: number; // Pontos de Função Ajustados

  // Effort Metrics
  effortHours: number; // Esforço total em horas
  durationDays: number; // Duração em dias
  durationWeeks: number; // Duração em semanas
  durationMonths: number; // Duração em meses

  // Cost Metrics
  totalCost: number; // Custo total
  costPerFunctionPoint: number; // Custo por ponto de função
  costPerPerson: number; // Custo por pessoa
  hoursPerPerson: number; // Horas por pessoa

  // Configuration
  averageDailyWorkingHours: number;
  teamSize: number;
  hourlyRateBRL: number;
  productivityFactor: number;

  // Legacy compatibility
  adjustedFunctionPoints: number;
  estimatedEffortHours: number;
  workingHoursPerDay: number;
  hourlyRate: number;
}

export interface ComponentBreakdown {
  ali: { count: number; points: number };
  aie: { count: number; points: number };
  ei: { count: number; points: number };
  eo: { count: number; points: number };
  eq: { count: number; points: number };
  total: { count: number; points: number };
}

export interface ComplexityBreakdown {
  low: { count: number; points: number };
  average: { count: number; points: number };
  high: { count: number; points: number };
}

export interface ComponentForBreakdown {
  componentType?: string;
  type?: string;
  functionPoints?: number;
  complexity?: string;
}

@Injectable()
export class FunctionPointCalculator {
  // General system characteristics as defined in FPA methodology
  private static readonly GSC_FACTORS = [
    {
      id: 1,
      name: 'Data Communications',
      description:
        'The degree to which the application communicates directly with the processor.',
    },
    {
      id: 2,
      name: 'Distributed Data Processing',
      description:
        'The degree to which the application transfers data among physical components of the application.',
    },
    {
      id: 3,
      name: 'Performance',
      description: 'The performance considerations of the user.',
    },
    {
      id: 4,
      name: 'Heavily Used Configuration',
      description:
        'The degree to which computer resource restrictions influence the development of the application.',
    },
    {
      id: 5,
      name: 'Transaction Rate',
      description: 'The rate of business transactions.',
    },
    {
      id: 6,
      name: 'Online Data Entry',
      description: 'The percentage of information that is entered online.',
    },
    {
      id: 7,
      name: 'End-User Efficiency',
      description:
        'The degree of consideration for human factors and ease of use.',
    },
    {
      id: 8,
      name: 'Online Update',
      description:
        'The degree to which internal logical files are updated online.',
    },
    {
      id: 9,
      name: 'Complex Processing',
      description:
        'The degree to which processing logic influences the development of the application.',
    },
    {
      id: 10,
      name: 'Reusability',
      description:
        'The degree to which the application has been specifically designed, developed, and supported for reuse.',
    },
    {
      id: 11,
      name: 'Installation Ease',
      description: 'The degree of difficulty in conversion and installation.',
    },
    {
      id: 12,
      name: 'Operational Ease',
      description:
        'The degree to which the application addresses operational aspects.',
    },
    {
      id: 13,
      name: 'Multiple Sites',
      description:
        'The degree to which the application has been specifically designed, developed, and supported for multiple installations.',
    },
    {
      id: 14,
      name: 'Facilitate Change',
      description:
        'The degree to which the application has been specifically designed, developed, and supported to facilitate change.',
    },
  ];

  static getGSCFactors() {
    return this.GSC_FACTORS;
  }

  /**
   * Calculate PFNA (Unadjusted Function Points) - Sum of all component function points
   */
  static calculateUnadjustedFunctionPoints(
    componentFunctionPoints: number[],
  ): number {
    return componentFunctionPoints.reduce((sum, points) => sum + points, 0);
  }

  /**
   * Calculate NI (Degree of Influence) - Sum of all GSC values
   */
  static calculateDegreeOfInfluence(gscValues: number[]): number {
    if (gscValues.length !== 14) {
      throw new Error('GSC must have exactly 14 values');
    }
    return gscValues.reduce((sum, value) => sum + value, 0);
  }

  /**
   * Calculate FA (Adjustment Factor) using new FPA formula
   * FA = 0.65 + (0.01 × NI)
   */
  static calculateAdjustmentFactor(ni: number): number {
    return 0.65 + 0.01 * ni;
  }

  /**
   * Calculate PFA (Adjusted Function Points)
   * PFA = PFNA × FA
   */
  static calculateAdjustedFunctionPoints(pfna: number, fa: number): number {
    return pfna * fa;
  }

  /**
   * Calculate effort in hours
   * Effort = PFA × Productivity Factor
   */
  static calculateEffortHours(pfa: number, productivityFactor: number): number {
    return pfa * productivityFactor;
  }

  /**
   * Calculate project duration in days
   * Duration = Effort ÷ (Team Size × Average Daily Working Hours)
   */
  static calculateDurationDays(
    effortHours: number,
    teamSize: number,
    averageDailyWorkingHours: number,
  ): number {
    if (teamSize <= 0) {
      throw new Error('Team size must be greater than 0');
    }
    return effortHours / (teamSize * averageDailyWorkingHours);
  }

  /**
   * Calculate total project cost
   * Cost = Effort × Hourly Rate
   */
  static calculateTotalCost(
    effortHours: number,
    hourlyRateBRL: number,
  ): number {
    return effortHours * hourlyRateBRL;
  }

  /**
   * Calculate complete estimation metrics with all new formulas
   */
  static calculateEstimationMetrics(
    componentFunctionPoints: number[],
    config: {
      averageDailyWorkingHours: number;
      teamSize: number;
      hourlyRateBRL: number;
      productivityFactor: number;
      generalSystemCharacteristics?: number[];
    },
  ): EstimationMetrics {
    // Step 1: Calculate PFNA
    const pfna = this.calculateUnadjustedFunctionPoints(
      componentFunctionPoints,
    );

    // Step 2: Calculate NI and FA
    let ni = 0;
    let fa = 1; // Default if no GSC provided

    if (config.generalSystemCharacteristics) {
      ni = this.calculateDegreeOfInfluence(config.generalSystemCharacteristics);
      fa = this.calculateAdjustmentFactor(ni);
    }

    // Step 3: Calculate PFA
    const pfa = this.calculateAdjustedFunctionPoints(pfna, fa);

    // Step 4: Calculate effort
    const effortHours = this.calculateEffortHours(
      pfa,
      config.productivityFactor,
    );

    // Step 5: Calculate duration
    const durationDays = this.calculateDurationDays(
      effortHours,
      config.teamSize,
      config.averageDailyWorkingHours,
    );
    const durationWeeks = durationDays / 5; // 5 working days per week
    const durationMonths = durationDays / 21; // 21 working days per month

    // Step 6: Calculate costs
    const totalCost = this.calculateTotalCost(
      effortHours,
      config.hourlyRateBRL,
    );
    const costPerFunctionPoint = totalCost / pfa;
    const costPerPerson = totalCost / config.teamSize;
    const hoursPerPerson = effortHours / config.teamSize;

    return {
      // New FPA metrics
      pfna,
      ni,
      fa,
      pfa,
      effortHours,
      durationDays,
      durationWeeks,
      durationMonths,
      totalCost,
      costPerFunctionPoint,
      costPerPerson,
      hoursPerPerson,

      // Configuration
      averageDailyWorkingHours: config.averageDailyWorkingHours,
      teamSize: config.teamSize,
      hourlyRateBRL: config.hourlyRateBRL,
      productivityFactor: config.productivityFactor,

      // Legacy compatibility
      adjustedFunctionPoints: pfa,
      estimatedEffortHours: effortHours,
      workingHoursPerDay: config.averageDailyWorkingHours,
      hourlyRate: config.hourlyRateBRL,
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  static calculateValueAdjustmentFactor(
    gscValues: GeneralSystemCharacteristic[],
  ): number {
    if (gscValues.length !== 14) {
      throw new Error('All 14 General System Characteristics must be provided');
    }

    const totalDegreeOfInfluence = gscValues.reduce(
      (sum, gsc) => sum + gsc.degreeOfInfluence,
      0,
    );

    return this.calculateAdjustmentFactor(totalDegreeOfInfluence);
  }

  /**
   * Legacy method for backward compatibility
   */
  static calculateEffortInPersonHours(
    adjustedFunctionPoints: number,
    productivityFactor: number,
  ): number {
    return this.calculateEffortHours(
      adjustedFunctionPoints,
      productivityFactor,
    );
  }

  /**
   * Legacy method for backward compatibility
   */
  static calculateDurationInCalendarDays(
    effortInPersonHours: number,
    teamSize: number,
    workingHoursPerDay: number = 8,
  ): number {
    return this.calculateDurationDays(
      effortInPersonHours,
      teamSize,
      workingHoursPerDay,
    );
  }

  /**
   * Calculate component breakdown by type
   */
  static calculateComponentBreakdown(
    components: ComponentForBreakdown[],
  ): ComponentBreakdown {
    const breakdown = {
      ali: { count: 0, points: 0 },
      aie: { count: 0, points: 0 },
      ei: { count: 0, points: 0 },
      eo: { count: 0, points: 0 },
      eq: { count: 0, points: 0 },
      total: { count: components.length, points: 0 },
    };

    components.forEach((component) => {
      const type =
        component.componentType?.toLowerCase() || component.type?.toLowerCase();
      const points = component.functionPoints || 0;

      switch (type) {
        case 'ali':
          breakdown.ali.count++;
          breakdown.ali.points += points;
          break;
        case 'aie':
          breakdown.aie.count++;
          breakdown.aie.points += points;
          break;
        case 'ei':
          breakdown.ei.count++;
          breakdown.ei.points += points;
          break;
        case 'eo':
          breakdown.eo.count++;
          breakdown.eo.points += points;
          break;
        case 'eq':
          breakdown.eq.count++;
          breakdown.eq.points += points;
          break;
      }

      breakdown.total.points += points;
    });

    return breakdown;
  }

  /**
   * Calculate complexity breakdown
   */
  static calculateComplexityBreakdown(
    components: ComponentForBreakdown[],
  ): ComplexityBreakdown {
    const breakdown = {
      low: { count: 0, points: 0 },
      average: { count: 0, points: 0 },
      high: { count: 0, points: 0 },
    };

    components.forEach((component) => {
      const complexity = component.complexity?.toLowerCase();
      const points = component.functionPoints || 0;

      switch (complexity) {
        case 'low':
          breakdown.low.count++;
          breakdown.low.points += points;
          break;
        case 'average':
          breakdown.average.count++;
          breakdown.average.points += points;
          break;
        case 'high':
          breakdown.high.count++;
          breakdown.high.points += points;
          break;
      }
    });

    return breakdown;
  }

  /**
   * Validate estimation inputs
   */
  static validateEstimationInputs(config: {
    averageDailyWorkingHours: number;
    teamSize: number;
    hourlyRateBRL: number;
    productivityFactor: number;
    generalSystemCharacteristics?: number[];
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (
      config.averageDailyWorkingHours < 1 ||
      config.averageDailyWorkingHours > 24
    ) {
      errors.push('Average daily working hours must be between 1 and 24');
    }

    if (config.teamSize < 1 || config.teamSize > 100) {
      errors.push('Team size must be between 1 and 100');
    }

    if (config.hourlyRateBRL < 0.01) {
      errors.push('Hourly rate must be positive');
    }

    if (config.productivityFactor < 1 || config.productivityFactor > 100) {
      errors.push(
        'Productivity factor must be between 1 and 100 hours per function point',
      );
    }

    if (config.generalSystemCharacteristics) {
      if (config.generalSystemCharacteristics.length !== 14) {
        errors.push(
          'General System Characteristics must have exactly 14 values',
        );
      } else {
        config.generalSystemCharacteristics.forEach((value, index) => {
          if (value < 0 || value > 5) {
            errors.push(`GSC value ${index + 1} must be between 0 and 5`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

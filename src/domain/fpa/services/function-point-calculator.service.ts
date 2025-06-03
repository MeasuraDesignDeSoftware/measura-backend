export interface GeneralSystemCharacteristic {
  name: string;
  description: string;
  degreeOfInfluence: number; // From 0 to 5
}

// FR09: Enhanced estimation interface
export interface EstimationMetrics {
  adjustedFunctionPoints: number;
  productivityFactor: number;
  effortInPersonHours: number;
  effortInPersonDays: number;
  effortInPersonMonths: number;
  estimatedDurationCalendarDays: number;
  totalCost: number;
  teamSize?: number;
  workingHoursPerDay: number;
  hourlyRate?: number;
}

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

  static calculateUnadjustedFunctionPoints(
    ilfCount: number,
    eifCount: number,
    eiCount: number,
    eoCount: number,
    eqCount: number,
  ): number {
    return ilfCount + eifCount + eiCount + eoCount + eqCount;
  }

  static calculateValueAdjustmentFactor(
    gscValues: GeneralSystemCharacteristic[],
  ): number {
    // Ensure all 14 GSCs are provided
    if (gscValues.length !== 14) {
      throw new Error('All 14 General System Characteristics must be provided');
    }

    // Calculate total degree of influence (TDI)
    const totalDegreeOfInfluence = gscValues.reduce(
      (sum, gsc) => sum + gsc.degreeOfInfluence,
      0,
    );

    // VAF = (TDI * 0.01) + 0.65
    return totalDegreeOfInfluence * 0.01 + 0.65;
  }

  static calculateAdjustedFunctionPoints(
    unadjustedFunctionPoints: number,
    valueAdjustmentFactor: number,
  ): number {
    return unadjustedFunctionPoints * valueAdjustmentFactor;
  }

  static calculateEffortInPersonHours(
    adjustedFunctionPoints: number,
    productivityFactor: number,
  ): number {
    return adjustedFunctionPoints * productivityFactor;
  }

  // FR09: Enhanced estimation support
  static calculateEstimationMetrics(
    adjustedFunctionPoints: number,
    productivityFactor: number,
    teamSize?: number,
    workingHoursPerDay: number = 8,
    hourlyRate?: number,
  ): EstimationMetrics {
    const effortInPersonHours = this.calculateEffortInPersonHours(
      adjustedFunctionPoints,
      productivityFactor,
    );

    const effortInPersonDays = effortInPersonHours / workingHoursPerDay;
    const effortInPersonMonths = effortInPersonDays / 21; // 21 working days per month

    let estimatedDurationCalendarDays = 0;
    if (teamSize && teamSize > 0) {
      const totalPersonDays = effortInPersonDays;
      estimatedDurationCalendarDays = Math.ceil(totalPersonDays / teamSize);
    }

    let totalCost = 0;
    if (hourlyRate) {
      totalCost = effortInPersonHours * hourlyRate;
    }

    return {
      adjustedFunctionPoints,
      productivityFactor,
      effortInPersonHours,
      effortInPersonDays,
      effortInPersonMonths,
      estimatedDurationCalendarDays,
      totalCost,
      teamSize,
      workingHoursPerDay,
      hourlyRate,
    };
  }

  // FR09: Calculate cost estimation
  static calculateTotalCost(
    effortInPersonHours: number,
    hourlyRate: number,
  ): number {
    return effortInPersonHours * hourlyRate;
  }

  // FR09: Calculate duration in calendar days
  static calculateDurationInCalendarDays(
    effortInPersonHours: number,
    teamSize: number,
    workingHoursPerDay: number = 8,
  ): number {
    if (teamSize <= 0) {
      throw new Error('Team size must be greater than 0');
    }

    const totalPersonDays = effortInPersonHours / workingHoursPerDay;
    return Math.ceil(totalPersonDays / teamSize);
  }
}

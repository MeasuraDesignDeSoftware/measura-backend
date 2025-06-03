import { Injectable } from '@nestjs/common';
import { Estimate } from '@domain/fpa/entities/estimate.entity';
import { FunctionPointCalculator } from '@domain/fpa/services/function-point-calculator.service';
import { TeamSizeEstimationService } from '@domain/fpa/services/team-size-estimation.service';
import { TrendAnalysisService, TrendMetric } from '@domain/fpa/services/trend-analysis.service';

export interface DetailedReportSection {
  title: string;
  content: string | string[];
}

export interface DetailedReport {
  title: string;
  date: string;
  summary: string;
  sections: DetailedReportSection[];
}

export interface SummaryReport {
  title: string;
  totalFunctionPoints: number;
  adjustedFunctionPoints: number;
  estimatedEffort: number;
  teamSize: number;
  duration: number;
  gscScore: number;
  date: string;
}

export interface ComparisonReport {
  title: string;
  date: string;
  estimates: {
    id: string;
    name: string;
    version: number;
    date: string;
    functionPoints: number;
    effort: number;
  }[];
  percentageDifferences: {
    functionPoints: number;
    effort: number;
  }[];
  trendAnalysis: {
    trend: string;
    percentageChange: number;
  };
}

@Injectable()
export class ReportGeneratorService {
  constructor(
    private readonly functionPointCalculator: FunctionPointCalculator,
    private readonly teamSizeEstimationService: TeamSizeEstimationService,
    private readonly trendAnalysisService: TrendAnalysisService,
  ) {}

  generateDetailedReport(estimate: Estimate): DetailedReport {
    // Get GSC factors from the calculator - use static method
    const gscFactors = FunctionPointCalculator.getGSCFactors();

    // Prepare detailed GSC section
    const gscDetails = gscFactors.map((factor, index) => {
      return `${factor.name} (${factor.id}): ${estimate.generalSystemCharacteristics[index] || 0} - ${factor.description}`;
    });

    // Calculate team size estimates
    const teamSizeEstimation = this.teamSizeEstimationService.estimateTeamSize({
      adjustedFunctionPoints: estimate.adjustedFunctionPoints,
      productivityFactor: estimate.productivityFactor,
      hoursPerDayPerPerson: 6, // Assuming 6 productive hours per day
    });

    // Format function point counts by component type
    const functionPointsBreakdown = [
      `Internal Logical Files (ILF): ${estimate.internalLogicalFiles.length} components`,
      `External Interface Files (EIF): ${estimate.externalInterfaceFiles.length} components`,
      `External Inputs (EI): ${estimate.externalInputs.length} components`,
      `External Outputs (EO): ${estimate.externalOutputs.length} components`,
      `External Queries (EQ): ${estimate.externalQueries.length} components`,
    ];

    return {
      title: `Detailed Function Point Analysis Report: ${estimate.name}`,
      date: estimate.updatedAt.toISOString().split('T')[0],
      summary: estimate.description,
      sections: [
        {
          title: 'Project Information',
          content: [
            `Project ID: ${estimate.projectId.toString()}`,
            `Status: ${estimate.status}`,
            `Version: ${estimate.version}`,
            `Created By: ${estimate.createdBy.toString()}`,
          ],
        },
        {
          title: 'Function Point Counts',
          content: [
            `Total Component Count: ${
              estimate.internalLogicalFiles.length +
              estimate.externalInterfaceFiles.length +
              estimate.externalInputs.length +
              estimate.externalOutputs.length +
              estimate.externalQueries.length
            }`,
            ...functionPointsBreakdown,
            `Unadjusted Function Points: ${estimate.unadjustedFunctionPoints}`,
            `Value Adjustment Factor: ${estimate.valueAdjustmentFactor.toFixed(2)}`,
            `Adjusted Function Points: ${estimate.adjustedFunctionPoints}`,
          ],
        },
        {
          title: 'General System Characteristics',
          content: gscDetails,
        },
        {
          title: 'Effort Estimation',
          content: [
            `Productivity Factor: ${estimate.productivityFactor} hours per function point`,
            `Estimated Effort: ${estimate.estimatedEffortHours} person-hours`,
            `Estimated Effort: ${(estimate.estimatedEffortHours / 8).toFixed(1)} person-days`,
            `Estimated Effort: ${(estimate.estimatedEffortHours / 8 / 21).toFixed(1)} person-months`,
          ],
        },
        {
          title: 'Team Size and Duration Estimation',
          content: [
            `Recommended Team Size: ${teamSizeEstimation.recommendedTeamSize} people`,
            `Recommended Duration: ${teamSizeEstimation.recommendedDurationMonths.toFixed(1)} months`,
            `Minimum Team Size: ${teamSizeEstimation.minTeamSize} people`,
            `Maximum Team Size: ${teamSizeEstimation.maxTeamSize} people`,
            `Minimum Duration: ${teamSizeEstimation.minDurationMonths.toFixed(1)} months`,
            `Maximum Duration: ${teamSizeEstimation.maxDurationMonths.toFixed(1)} months`,
          ],
        },
        {
          title: 'Additional Notes',
          content: estimate.notes || 'No additional notes provided',
        },
      ],
    };
  }

  generateSummaryReport(estimate: Estimate): SummaryReport {
    const gscTotal = estimate.generalSystemCharacteristics.reduce(
      (sum, val) => sum + val,
      0,
    );

    return {
      title: `Function Point Analysis Summary: ${estimate.name}`,
      totalFunctionPoints: estimate.unadjustedFunctionPoints,
      adjustedFunctionPoints: estimate.adjustedFunctionPoints,
      estimatedEffort: estimate.estimatedEffortHours,
      teamSize: this.teamSizeEstimationService.estimateTeamSize({
        adjustedFunctionPoints: estimate.adjustedFunctionPoints,
        productivityFactor: estimate.productivityFactor,
        hoursPerDayPerPerson: 6,
      }).recommendedTeamSize,
      duration: this.teamSizeEstimationService.estimateTeamSize({
        adjustedFunctionPoints: estimate.adjustedFunctionPoints,
        productivityFactor: estimate.productivityFactor,
        hoursPerDayPerPerson: 6,
      }).recommendedDurationMonths,
      gscScore: gscTotal,
      date: estimate.updatedAt.toISOString().split('T')[0],
    };
  }

  generateComparisonReport(estimates: Estimate[]): ComparisonReport {
    if (!estimates || estimates.length < 2) {
      throw new Error('At least two estimates are required for comparison');
    }

    // Sort estimates by version
    const sortedEstimates = [...estimates].sort(
      (a, b) => a.version - b.version,
    );

    // Prepare comparison data
    const estimatesData = sortedEstimates.map((est) => ({
      id: est._id.toString(),
      name: est.name,
      version: est.version,
      date: est.updatedAt.toISOString().split('T')[0],
      functionPoints: est.adjustedFunctionPoints,
      effort: est.estimatedEffortHours,
    }));

    // Calculate percentage differences between consecutive versions
    const percentageDifferences: Array<{
      functionPoints: number;
      effort: number;
    }> = [];
    for (let i = 1; i < sortedEstimates.length; i++) {
      const prev = sortedEstimates[i - 1];
      const curr = sortedEstimates[i];

      const fpDiff =
        ((curr.adjustedFunctionPoints - prev.adjustedFunctionPoints) /
          prev.adjustedFunctionPoints) *
        100;
      const effortDiff =
        ((curr.estimatedEffortHours - prev.estimatedEffortHours) /
          prev.estimatedEffortHours) *
        100;

      percentageDifferences.push({
        functionPoints: parseFloat(fpDiff.toFixed(2)),
        effort: parseFloat(effortDiff.toFixed(2)),
      });
    }

    // Perform trend analysis
    const trendResult = this.trendAnalysisService.analyzeTrend(
      sortedEstimates,
      TrendMetric.ADJUSTED_FP,
    );

    return {
      title: `Estimate Comparison Report: ${sortedEstimates[0].name}`,
      date: new Date().toISOString().split('T')[0],
      estimates: estimatesData,
      percentageDifferences,
      trendAnalysis: {
        trend: trendResult.trend,
        percentageChange: parseFloat(trendResult.percentageChange.toFixed(2)),
      },
    };
  }

  generateJSONExport(estimate: Estimate): string {
    // Create a clean export object without internal MongoDB details
    const exportObj = {
      name: estimate.name,
      description: estimate.description,
      status: estimate.status,
      version: estimate.version,
      createdAt: estimate.createdAt,
      updatedAt: estimate.updatedAt,
      unadjustedFunctionPoints: estimate.unadjustedFunctionPoints,
      valueAdjustmentFactor: estimate.valueAdjustmentFactor,
      adjustedFunctionPoints: estimate.adjustedFunctionPoints,
      estimatedEffortHours: estimate.estimatedEffortHours,
      productivityFactor: estimate.productivityFactor,
      generalSystemCharacteristics: estimate.generalSystemCharacteristics,
      notes: estimate.notes,
      componentCounts: {
        internalLogicalFiles: estimate.internalLogicalFiles.length,
        externalInterfaceFiles: estimate.externalInterfaceFiles.length,
        externalInputs: estimate.externalInputs.length,
        externalOutputs: estimate.externalOutputs.length,
        externalQueries: estimate.externalQueries.length,
      },
    };

    return JSON.stringify(exportObj, null, 2);
  }

  generateCSVExport(estimates: Estimate[]): string {
    // Define CSV headers
    const headers = [
      'Name',
      'Version',
      'Status',
      'Date',
      'Unadjusted FP',
      'VAF',
      'Adjusted FP',
      'Effort (hours)',
      'Productivity Factor',
      'ILF Count',
      'EIF Count',
      'EI Count',
      'EO Count',
      'EQ Count',
    ];

    // Create CSV rows
    const rows = estimates.map((est) => [
      est.name,
      est.version,
      est.status,
      est.updatedAt.toISOString().split('T')[0],
      est.unadjustedFunctionPoints,
      est.valueAdjustmentFactor,
      est.adjustedFunctionPoints,
      est.estimatedEffortHours,
      est.productivityFactor,
      est.internalLogicalFiles.length,
      est.externalInterfaceFiles.length,
      est.externalInputs.length,
      est.externalOutputs.length,
      est.externalQueries.length,
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}

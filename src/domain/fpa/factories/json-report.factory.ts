/**
 * DESIGN PATTERN: Factory Method (Creational - Class Scope)
 *
 * Pattern Location: Concrete Factory for JSON reports
 * Extends: ReportFactory
 * Creates: JSONReport instances
 *
 * This concrete factory creates JSON-formatted reports.
 */

import { Injectable } from '@nestjs/common';
import { Estimate } from '@domain/fpa/entities/estimate.entity';
import { ReportFactory, IReport } from './report.factory';

/**
 * Concrete Product - JSON Report
 */
class JSONReport implements IReport {
  getFormat(): string {
    return 'json';
  }

  getMimeType(): string {
    return 'application/json';
  }

  async generate(estimate: Estimate): Promise<string> {
    const reportData = {
      metadata: {
        reportType: 'Function Point Analysis',
        generatedAt: new Date().toISOString(),
        version: '1.0',
      },
      estimate: {
        id: estimate._id?.toString(),
        name: estimate.name,
        description: estimate.description,
        status: estimate.status,
        version: estimate.version,
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt,
      },
      functionPoints: {
        unadjusted: estimate.unadjustedFunctionPoints,
        valueAdjustmentFactor: estimate.valueAdjustmentFactor,
        adjusted: estimate.adjustedFunctionPoints,
      },
      effort: {
        estimatedHours: estimate.estimatedEffortHours,
        estimatedDays: (estimate.estimatedEffortHours / 8).toFixed(2),
        estimatedMonths: (estimate.estimatedEffortHours / 8 / 21).toFixed(2),
        productivityFactor: estimate.productivityFactor,
      },
      components: {
        internalLogicalFiles: {
          count: estimate.internalLogicalFiles.length,
          ids: estimate.internalLogicalFiles.map(id => id.toString()),
        },
        externalInterfaceFiles: {
          count: estimate.externalInterfaceFiles.length,
          ids: estimate.externalInterfaceFiles.map(id => id.toString()),
        },
        externalInputs: {
          count: estimate.externalInputs.length,
          ids: estimate.externalInputs.map(id => id.toString()),
        },
        externalOutputs: {
          count: estimate.externalOutputs.length,
          ids: estimate.externalOutputs.map(id => id.toString()),
        },
        externalQueries: {
          count: estimate.externalQueries.length,
          ids: estimate.externalQueries.map(id => id.toString()),
        },
        total: {
          count:
            estimate.internalLogicalFiles.length +
            estimate.externalInterfaceFiles.length +
            estimate.externalInputs.length +
            estimate.externalOutputs.length +
            estimate.externalQueries.length,
        },
      },
      generalSystemCharacteristics:
        estimate.generalSystemCharacteristics?.map((value, index) => ({
          id: index + 1,
          value,
        })) || [],
      notes: estimate.notes,
    };

    return JSON.stringify(reportData, null, 2);
  }
}

/**
 * Concrete Factory - Creates JSON reports
 */
@Injectable()
export class JSONReportFactory extends ReportFactory {
  /**
   * Factory Method implementation
   * Returns a new instance of JSONReport
   */
  protected createReport(): IReport {
    return new JSONReport();
  }
}

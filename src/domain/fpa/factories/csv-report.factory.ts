/**
 * DESIGN PATTERN: Factory Method (Creational - Class Scope)
 *
 * Pattern Location: Concrete Factory for CSV reports
 * Extends: ReportFactory
 * Creates: CSVReport instances
 *
 * This concrete factory creates CSV-formatted reports.
 */

import { Injectable } from '@nestjs/common';
import { Estimate } from '@domain/fpa/entities/estimate.entity';
import { ReportFactory, IReport } from './report.factory';

/**
 * Concrete Product - CSV Report
 */
class CSVReport implements IReport {
  getFormat(): string {
    return 'csv';
  }

  getMimeType(): string {
    return 'text/csv';
  }

  async generate(estimate: Estimate): Promise<string> {
    const rows: string[][] = [];

    // Header
    rows.push([
      'Field',
      'Value',
    ]);

    // Basic Information
    rows.push(['Name', estimate.name]);
    rows.push(['Description', estimate.description || '']);
    rows.push(['Status', estimate.status]);
    rows.push(['Version', estimate.version.toString()]);
    rows.push(['']);

    // Function Points
    rows.push(['Metric', 'Count']);
    rows.push(['Unadjusted Function Points', estimate.unadjustedFunctionPoints.toString()]);
    rows.push(['Value Adjustment Factor', estimate.valueAdjustmentFactor.toFixed(2)]);
    rows.push(['Adjusted Function Points', estimate.adjustedFunctionPoints.toString()]);
    rows.push(['Estimated Effort Hours', estimate.estimatedEffortHours.toString()]);
    rows.push(['Productivity Factor', estimate.productivityFactor.toString()]);
    rows.push(['']);

    // Component Counts
    rows.push(['Component Type', 'Count']);
    rows.push(['Internal Logical Files (ILF)', estimate.internalLogicalFiles.length.toString()]);
    rows.push(['External Interface Files (EIF)', estimate.externalInterfaceFiles.length.toString()]);
    rows.push(['External Inputs (EI)', estimate.externalInputs.length.toString()]);
    rows.push(['External Outputs (EO)', estimate.externalOutputs.length.toString()]);
    rows.push(['External Queries (EQ)', estimate.externalQueries.length.toString()]);

    // Convert to CSV format
    return rows.map(row => this.escapeCSVRow(row)).join('\n');
  }

  private escapeCSVRow(row: string[]): string {
    return row
      .map(cell => {
        // Escape double quotes and wrap in quotes if necessary
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      })
      .join(',');
  }
}

/**
 * Concrete Factory - Creates CSV reports
 */
@Injectable()
export class CSVReportFactory extends ReportFactory {
  /**
   * Factory Method implementation
   * Returns a new instance of CSVReport
   */
  protected createReport(): IReport {
    return new CSVReport();
  }
}

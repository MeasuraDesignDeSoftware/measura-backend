/**
 * DESIGN PATTERN: Factory Method (Creational - Class Scope)
 *
 * Pattern Location: Concrete Factory for PDF reports
 * Extends: ReportFactory
 * Creates: PDFReport instances
 *
 * This concrete factory overrides the factory method to return PDF-specific report objects.
 */

import { Injectable } from '@nestjs/common';
import { Estimate } from '@domain/fpa/entities/estimate.entity';
import { ReportFactory, IReport } from './report.factory';
import * as puppeteer from 'puppeteer';

/**
 * Concrete Product - PDF Report
 */
class PDFReport implements IReport {
  getFormat(): string {
    return 'pdf';
  }

  getMimeType(): string {
    return 'application/pdf';
  }

  async generate(estimate: Estimate): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const html = this.createHTMLContent(estimate);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return pdf;
    } finally {
      await browser.close();
    }
  }

  private createHTMLContent(estimate: Estimate): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          .info-section { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .metric { display: inline-block; margin: 10px 20px 10px 0; }
          .metric-label { font-weight: bold; color: #7f8c8d; }
          .metric-value { font-size: 1.2em; color: #2c3e50; }
        </style>
      </head>
      <body>
        <h1>Function Point Analysis Report</h1>
        <h2>${estimate.name}</h2>

        <div class="info-section">
          <p><strong>Description:</strong> ${estimate.description || 'N/A'}</p>
          <p><strong>Status:</strong> ${estimate.status}</p>
          <p><strong>Version:</strong> ${estimate.version}</p>
        </div>

        <h2>Function Point Summary</h2>
        <div class="info-section">
          <div class="metric">
            <div class="metric-label">Unadjusted FP</div>
            <div class="metric-value">${estimate.unadjustedFunctionPoints}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Adjustment Factor</div>
            <div class="metric-value">${estimate.valueAdjustmentFactor.toFixed(2)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Adjusted FP</div>
            <div class="metric-value">${estimate.adjustedFunctionPoints}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Estimated Effort</div>
            <div class="metric-value">${estimate.estimatedEffortHours} hours</div>
          </div>
        </div>

        <h2>Component Breakdown</h2>
        <div class="info-section">
          <p><strong>Internal Logical Files (ILF):</strong> ${estimate.internalLogicalFiles.length}</p>
          <p><strong>External Interface Files (EIF):</strong> ${estimate.externalInterfaceFiles.length}</p>
          <p><strong>External Inputs (EI):</strong> ${estimate.externalInputs.length}</p>
          <p><strong>External Outputs (EO):</strong> ${estimate.externalOutputs.length}</p>
          <p><strong>External Queries (EQ):</strong> ${estimate.externalQueries.length}</p>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Concrete Factory - Creates PDF reports
 * This is a concrete implementation of the Factory Method pattern
 */
@Injectable()
export class PDFReportFactory extends ReportFactory {
  /**
   * Factory Method implementation
   * Returns a new instance of PDFReport
   */
  protected createReport(): IReport {
    return new PDFReport();
  }

  /**
   * Optional: Factory-specific configuration
   */
  async generateReport(estimate: Estimate): Promise<{
    content: Buffer;
    format: string;
    mimeType: string;
  }> {
    this.validateEstimate(estimate);
    return super.generateReport(estimate) as Promise<{
      content: Buffer;
      format: string;
      mimeType: string;
    }>;
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportGeneratorService } from '@domain/fpa/services/report-generator.service';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import { Inject } from '@nestjs/common';
import { GenerateComparisonReportDto } from '@application/fpa/dtos/report.dto';
import { Estimate } from '@domain/fpa/entities/estimate.entity';
import {
  DetailedReport,
  DetailedReportSection,
  SummaryReport,
  ComparisonReport,
} from '@domain/fpa/services/report-generator.service';
import * as puppeteer from 'puppeteer';

@ApiTags('estimate-reports')
@Controller('estimates/reports')
export class ReportsController {
  constructor(
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
    private readonly reportGeneratorService: ReportGeneratorService,
  ) {}

  @Get(':id/detailed')
  @ApiOperation({ summary: 'Generate a detailed report for an estimate' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Report format (json, html, or pdf)',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed report generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async generateDetailedReport(
    @Param('id') id: string,
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    try {
      const estimate = await this.estimateRepository.findById(id);

      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }

      const report =
        this.reportGeneratorService.generateDetailedReport(estimate);

      if (format === 'html') {
        // Simple HTML formatting for demonstration (in a real app, you'd use a template engine)
        const html = this.convertToHtml(report);
        return res
          .status(HttpStatus.OK)
          .header('Content-Type', 'text/html')
          .send(html);
      } else if (format === 'pdf') {
        // Generate PDF using puppeteer
        const html = this.convertToHtml(report);
        const pdf = await this.generatePdf(html, `Detailed_Report_${id}`);
        return res
          .status(HttpStatus.OK)
          .header('Content-Type', 'application/pdf')
          .header(
            'Content-Disposition',
            `attachment; filename="Detailed_Report_${id}.pdf"`,
          )
          .send(pdf);
      }

      return res.status(HttpStatus.OK).json(report);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Generate a summary report for an estimate' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Report format (json, html, or pdf)',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary report generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async generateSummaryReport(
    @Param('id') id: string,
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    try {
      const estimate = await this.estimateRepository.findById(id);

      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }

      const report =
        this.reportGeneratorService.generateSummaryReport(estimate);

      if (format === 'html') {
        // Create HTML version of the summary report
        const html = this.convertSummaryToHtml(report);
        return res
          .status(HttpStatus.OK)
          .header('Content-Type', 'text/html')
          .send(html);
      } else if (format === 'pdf') {
        // Generate PDF using puppeteer
        const html = this.convertSummaryToHtml(report);
        const pdf = await this.generatePdf(html, `Summary_Report_${id}`);
        return res
          .status(HttpStatus.OK)
          .header('Content-Type', 'application/pdf')
          .header(
            'Content-Disposition',
            `attachment; filename="Summary_Report_${id}.pdf"`,
          )
          .send(pdf);
      }

      return res.status(HttpStatus.OK).json(report);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post('comparison')
  @ApiOperation({
    summary: 'Generate a comparison report for multiple estimates',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Report format (json, html, or pdf)',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparison report generated successfully',
  })
  @ApiResponse({ status: 404, description: 'One or more estimates not found' })
  async generateComparisonReport(
    @Body() dto: GenerateComparisonReportDto,
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    try {
      const estimates: Estimate[] = [];

      for (const id of dto.estimateIds) {
        const estimate = await this.estimateRepository.findById(id);
        if (!estimate) {
          throw new NotFoundException(`Estimate with ID ${id} not found`);
        }
        estimates.push(estimate);
      }

      if (estimates.length < 2) {
        throw new InternalServerErrorException(
          'At least two estimates are required for comparison',
        );
      }

      const report =
        this.reportGeneratorService.generateComparisonReport(estimates);

      if (format === 'html') {
        // Create HTML version of the comparison report
        const html = this.convertComparisonToHtml(report);
        return res
          .status(HttpStatus.OK)
          .header('Content-Type', 'text/html')
          .send(html);
      } else if (format === 'pdf') {
        // Generate PDF using puppeteer
        const html = this.convertComparisonToHtml(report);
        const pdf = await this.generatePdf(html, `Comparison_Report`);
        return res
          .status(HttpStatus.OK)
          .header('Content-Type', 'application/pdf')
          .header(
            'Content-Disposition',
            `attachment; filename="Comparison_Report.pdf"`,
          )
          .send(pdf);
      }

      return res.status(HttpStatus.OK).json(report);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to generate comparison: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export an estimate in various formats' })
  @ApiParam({ name: 'id', description: 'The estimate ID' })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Export format (json, csv, or pdf)',
  })
  @ApiResponse({ status: 200, description: 'Export generated successfully' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  async exportEstimate(
    @Param('id') id: string,
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    try {
      const estimate = await this.estimateRepository.findById(id);

      if (!estimate) {
        throw new NotFoundException(`Estimate with ID ${id} not found`);
      }

      let result;
      let contentType;
      let filename;

      if (format === 'csv') {
        result = this.reportGeneratorService.generateCSVExport([estimate]);
        contentType = 'text/csv';
        filename = `estimate_${id}_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (format === 'pdf') {
        // Generate a detailed report and convert to PDF
        const report =
          this.reportGeneratorService.generateDetailedReport(estimate);
        const html = this.convertToHtml(report);
        result = await this.generatePdf(html, `Estimate_${id}`);
        contentType = 'application/pdf';
        filename = `estimate_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        result = this.reportGeneratorService.generateJSONExport(estimate);
        contentType = 'application/json';
        filename = `estimate_${id}_${new Date().toISOString().split('T')[0]}.json`;
      }

      return res
        .status(HttpStatus.OK)
        .header('Content-Type', contentType)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(result);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private convertToHtml(report: DetailedReport): string {
    // A very basic HTML generator for demonstration purposes
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #555; margin-top: 20px; }
          .section { margin-bottom: 20px; }
          .date { color: #888; }
        </style>
      </head>
      <body>
        <h1>${report.title}</h1>
        <p class="date">Date: ${report.date}</p>
        <p>${report.summary}</p>
    `;

    report.sections.forEach((section: DetailedReportSection) => {
      html += `<div class="section">
        <h2>${section.title}</h2>`;

      if (Array.isArray(section.content)) {
        html += '<ul>';
        section.content.forEach((item: string) => {
          html += `<li>${item}</li>`;
        });
        html += '</ul>';
      } else {
        html += `<p>${section.content}</p>`;
      }

      html += '</div>';
    });

    html += `
      </body>
      </html>
    `;

    return html;
  }

  private convertSummaryToHtml(report: SummaryReport): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .date { color: #888; }
        </style>
      </head>
      <body>
        <h1>${report.title}</h1>
        <p class="date">Date: ${report.date}</p>
        
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Total Function Points (Unadjusted)</td>
            <td>${report.totalFunctionPoints}</td>
          </tr>
          <tr>
            <td>Adjusted Function Points</td>
            <td>${report.adjustedFunctionPoints}</td>
          </tr>
          <tr>
            <td>Estimated Effort (hours)</td>
            <td>${report.estimatedEffort}</td>
          </tr>
          <tr>
            <td>Recommended Team Size</td>
            <td>${report.teamSize}</td>
          </tr>
          <tr>
            <td>Estimated Duration (months)</td>
            <td>${report.duration}</td>
          </tr>
          <tr>
            <td>GSC Score</td>
            <td>${report.gscScore}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private convertComparisonToHtml(report: ComparisonReport): string {
    let estimatesHtml = '';
    report.estimates.forEach((est, index: number) => {
      estimatesHtml += `
        <tr>
          <td>${est.name}</td>
          <td>${est.version}</td>
          <td>${est.date}</td>
          <td>${est.functionPoints}</td>
          <td>${est.effort}</td>
          ${index > 0 ? `<td>${report.percentageDifferences[index - 1].functionPoints}%</td>` : '<td>-</td>'}
          ${index > 0 ? `<td>${report.percentageDifferences[index - 1].effort}%</td>` : '<td>-</td>'}
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #555; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .trend { font-weight: bold; }
          .date { color: #888; }
        </style>
      </head>
      <body>
        <h1>${report.title}</h1>
        <p class="date">Date: ${report.date}</p>
        
        <h2>Comparison Data</h2>
        <table>
          <tr>
            <th>Name</th>
            <th>Version</th>
            <th>Date</th>
            <th>Function Points</th>
            <th>Effort (hours)</th>
            <th>FP % Change</th>
            <th>Effort % Change</th>
          </tr>
          ${estimatesHtml}
        </table>
        
        <h2>Trend Analysis</h2>
        <p class="trend">Overall Trend: ${report.trendAnalysis.trend}</p>
        <p>Percentage Change: ${report.trendAnalysis.percentageChange}%</p>
      </body>
      </html>
    `;
  }

  private async generatePdf(html: string, title: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size: 10px; text-align: center; width: 100%;">${title}</div>`,
      footerTemplate:
        '<div style="font-size: 10px; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }
}

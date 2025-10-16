/**
 * Example Service demonstrating the use of implemented design patterns
 *
 * This service shows how to integrate:
 * - Builder Pattern: For constructing complex Estimate objects
 * - Observer Pattern: For notifying stakeholders of status changes
 * - Factory Method: For generating reports
 * - Chain of Responsibility: For validating FPA components
 *
 * This file serves as a reference implementation for the RA2 assignment.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  EstimateBuilder,
  EstimateDirector,
} from '@domain/fpa/builders/estimate.builder';
import { EstimateSubject } from '@domain/fpa/observers/estimate-subject';
import {
  EmailNotificationObserver,
  LogObserver,
  AuditObserver,
} from '@domain/fpa/observers/email-notification.observer';
import { EstimateStatusChangeEvent } from '@domain/fpa/observers/estimate-observer.interface';
import {
  Estimate,
  EstimateStatus,
  CountType,
} from '@domain/fpa/entities/estimate.entity';
import { PDFReportFactory } from '@domain/fpa/factories/pdf-report.factory';
import { CSVReportFactory } from '@domain/fpa/factories/csv-report.factory';
import { JSONReportFactory } from '@domain/fpa/factories/json-report.factory';
import { FPAComponentValidator } from '@domain/fpa/validators/fpa-validation-chain';

/**
 * Service demonstrating pattern usage
 */
@Injectable()
export class EstimateWithPatternsService {
  private readonly logger = new Logger(EstimateWithPatternsService.name);
  private readonly estimateSubject: EstimateSubject;
  private readonly validator: FPAComponentValidator;

  constructor(
    private readonly emailNotificationObserver: EmailNotificationObserver,
    private readonly logObserver: LogObserver,
    private readonly auditObserver: AuditObserver,
  ) {
    // OBSERVER PATTERN: Setup the subject and attach observers
    this.estimateSubject = new EstimateSubject();
    this.estimateSubject.attach(emailNotificationObserver);
    this.estimateSubject.attach(logObserver);
    this.estimateSubject.attach(auditObserver);

    this.logger.log(
      `Initialized with ${this.estimateSubject.getObserverCount()} observers: ${this.estimateSubject.getObserverNames().join(', ')}`,
    );

    // CHAIN OF RESPONSIBILITY PATTERN: Initialize validator
    this.validator = new FPAComponentValidator();
  }

  /**
   * Example 1: Using BUILDER PATTERN to create an estimate
   *
   * Pattern: Builder (Creational)
   * Benefit: Simplifies creation of complex Estimate objects with validation
   */
  async createEstimateUsingBuilder(params: {
    name: string;
    description: string;
    projectId: string;
    organizationId: string;
    createdBy: string;
    countType: CountType;
    applicationBoundary: string;
    countingScope: string;
    teamSize: number;
    hourlyRate: number;
    productivityFactor: number;
  }): Promise<Partial<Estimate>> {
    this.logger.log('Creating estimate using BUILDER PATTERN');

    // Create builder instance
    const builder = new EstimateBuilder();

    try {
      // Build the estimate step-by-step
      const estimate = builder
        .setBasicInfo(
          params.name,
          params.description,
          params.projectId,
          params.organizationId,
          params.createdBy,
        )
        .setCountType(params.countType)
        .setBoundaryAndScope(params.applicationBoundary, params.countingScope)
        .setTeamConfiguration(params.teamSize, params.hourlyRate)
        .setProductivityFactor(params.productivityFactor)
        .setStatus(EstimateStatus.DRAFT)
        .build();

      this.logger.log('Estimate created successfully using Builder');
      return estimate;
    } catch (error) {
      this.logger.error(`Builder validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example 2: Using BUILDER PATTERN with DIRECTOR
   *
   * Pattern: Builder (Creational) + Director
   * Benefit: Encapsulates common construction scenarios
   */
  async createMinimalEstimate(
    name: string,
    projectId: string,
    organizationId: string,
    createdBy: string,
  ): Promise<Partial<Estimate>> {
    this.logger.log('Creating minimal estimate using BUILDER + DIRECTOR');

    const builder = new EstimateBuilder();
    const director = new EstimateDirector(builder);

    const estimate = director.buildMinimalEstimate(
      name,
      'Minimal estimate created via Director',
      projectId,
      organizationId,
      createdBy,
      CountType.DEVELOPMENT_PROJECT,
      5, // team size
      150, // hourly rate
    );

    this.logger.log('Minimal estimate created via Director');
    return estimate;
  }

  /**
   * Example 3: Using OBSERVER PATTERN for status changes
   *
   * Pattern: Observer (Behavioral)
   * Benefit: Decouples status change logic from notification logic
   */
  async changeEstimateStatus(
    estimate: Estimate,
    newStatus: EstimateStatus,
    changedBy: string,
    reason?: string,
  ): Promise<void> {
    this.logger.log(
      `Changing estimate status using OBSERVER PATTERN: ${estimate.status} → ${newStatus}`,
    );

    const previousStatus = estimate.status;

    // Update the estimate status
    estimate.status = newStatus;
    estimate.updatedAt = new Date();

    // OBSERVER PATTERN: Notify all observers of the change
    const event: EstimateStatusChangeEvent = {
      estimate,
      previousStatus,
      newStatus,
      changedBy,
      changedAt: new Date(),
      reason,
    };

    await this.estimateSubject.notify(event);

    this.logger.log('All observers notified of status change');
  }

  /**
   * Example 4: Using FACTORY METHOD PATTERN for reports
   *
   * Pattern: Factory Method (Creational)
   * Benefit: Delegates report creation to specialized factories
   */
  async generateReport(
    estimate: Estimate,
    format: 'pdf' | 'csv' | 'json',
  ): Promise<{ content: string | Buffer; mimeType: string }> {
    this.logger.log(`Generating ${format.toUpperCase()} report using FACTORY METHOD PATTERN`);

    let factory;

    // FACTORY METHOD: Select appropriate factory based on format
    switch (format) {
      case 'pdf':
        factory = new PDFReportFactory();
        break;
      case 'csv':
        factory = new CSVReportFactory();
        break;
      case 'json':
        factory = new JSONReportFactory();
        break;
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }

    // Use the factory to generate the report
    const report = await factory.generateReport(estimate);

    this.logger.log(`${format.toUpperCase()} report generated successfully`);

    return {
      content: report.content,
      mimeType: report.mimeType,
    };
  }

  /**
   * Example 5: Using CHAIN OF RESPONSIBILITY for validation
   *
   * Pattern: Chain of Responsibility (Behavioral)
   * Benefit: Sequential validation with early exit on errors
   */
  async validateFPAComponent(
    componentType: 'ALI' | 'AIE' | 'EI' | 'EO' | 'EQ',
    param1: number,
    param2: number,
  ): Promise<{
    isValid: boolean;
    complexity?: string;
    functionPoints?: number;
    errors: string[];
    warnings: string[];
  }> {
    this.logger.log(
      `Validating ${componentType} component using CHAIN OF RESPONSIBILITY PATTERN`,
    );

    // CHAIN OF RESPONSIBILITY: Validation goes through multiple handlers
    const result = await this.validator.validateComponent(
      componentType,
      param1,
      param2,
    );

    this.logger.log(
      `Validation result: ${result.isValid ? 'PASSED' : 'FAILED'} ` +
        `(${result.errors.length} errors, ${result.warnings.length} warnings)`,
    );

    return {
      isValid: result.isValid,
      complexity: result.context.complexity,
      functionPoints: result.context.functionPoints,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  /**
   * Example 6: Complete workflow using multiple patterns
   *
   * This method demonstrates a complete workflow that uses:
   * - Builder: To create the estimate
   * - Chain of Responsibility: To validate components
   * - Observer: To notify status changes
   * - Factory Method: To generate final report
   */
  async completeEstimateWorkflow(params: {
    name: string;
    projectId: string;
    organizationId: string;
    createdBy: string;
    components: Array<{
      type: 'ALI' | 'AIE' | 'EI' | 'EO' | 'EQ';
      param1: number;
      param2: number;
    }>;
  }): Promise<{
    estimate: Partial<Estimate>;
    validationResults: any[];
    pdfReport: Buffer;
  }> {
    this.logger.log('Starting COMPLETE WORKFLOW using multiple patterns');

    // Step 1: BUILDER PATTERN - Create estimate
    this.logger.log('Step 1: Creating estimate with BUILDER');
    const builder = new EstimateBuilder();
    const estimate = builder
      .setBasicInfo(
        params.name,
        'Complete workflow estimate',
        params.projectId,
        params.organizationId,
        params.createdBy,
      )
      .setCountType(CountType.DEVELOPMENT_PROJECT)
      .setBoundaryAndScope(
        'Standard application boundary',
        'Full feature scope',
      )
      .setTeamConfiguration(5, 150)
      .setProductivityFactor(10)
      .build();

    // Step 2: CHAIN OF RESPONSIBILITY - Validate all components
    this.logger.log('Step 2: Validating components with CHAIN OF RESPONSIBILITY');
    const validationResults = [];
    for (const component of params.components) {
      const result = await this.validateFPAComponent(
        component.type,
        component.param1,
        component.param2,
      );
      validationResults.push(result);

      if (!result.isValid) {
        throw new Error(
          `Component validation failed: ${result.errors.join(', ')}`,
        );
      }
    }

    // Step 3: OBSERVER PATTERN - Finalize estimate
    this.logger.log('Step 3: Finalizing estimate with OBSERVER notifications');
    const fullEstimate = estimate as Estimate;
    fullEstimate._id = new Types.ObjectId();
    await this.changeEstimateStatus(
      fullEstimate,
      EstimateStatus.FINALIZED,
      params.createdBy,
      'Completed validation workflow',
    );

    // Step 4: FACTORY METHOD - Generate PDF report
    this.logger.log('Step 4: Generating PDF report with FACTORY METHOD');
    const report = await this.generateReport(fullEstimate, 'pdf');

    this.logger.log('COMPLETE WORKFLOW finished successfully');

    return {
      estimate,
      validationResults,
      pdfReport: report.content as Buffer,
    };
  }
}

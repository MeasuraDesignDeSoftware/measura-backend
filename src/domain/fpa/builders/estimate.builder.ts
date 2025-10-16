/**
 * DESIGN PATTERN: Builder (Creational - Object Scope)
 *
 * Purpose: Separate the construction of a complex Estimate object from its representation
 * so that the same construction process can create different representations.
 *
 * Pattern Location: This file implements the Builder pattern for Estimate entities
 * Director: EstimateDirector (optional, can build directly with builder)
 *
 * GoF Classification: Creational Pattern - Object Scope
 *
 * Justification: The Estimate entity is complex with:
 * - 14 General System Characteristics (GSC) values
 * - 5 types of FPA components (ALI, AIE, EI, EO, EQ)
 * - Multiple calculation dependencies (PFNA → FA → PFA → Effort)
 * - Various validation rules for each step
 *
 * The Builder pattern allows step-by-step construction with validation at each stage,
 * making it easier to create valid Estimate objects and preventing invalid states.
 */

import { Types } from 'mongoose';
import {
  Estimate,
  EstimateStatus,
  CountType,
  DocumentReference,
} from '@domain/fpa/entities/estimate.entity';
import { FunctionPointCalculator } from '@domain/fpa/services/function-point-calculator.service';

/**
 * Builder Interface (optional in TypeScript, but good for documentation)
 */
export interface IEstimateBuilder {
  setBasicInfo(
    name: string,
    description: string,
    projectId: string,
    organizationId: string,
    createdBy: string,
  ): EstimateBuilder;
  setCountType(countType: CountType): EstimateBuilder;
  setBoundaryAndScope(
    applicationBoundary: string,
    countingScope: string,
  ): EstimateBuilder;
  addInternalLogicalFile(aliId: string): EstimateBuilder;
  addExternalInterfaceFile(aieId: string): EstimateBuilder;
  addExternalInput(eiId: string): EstimateBuilder;
  addExternalOutput(eoId: string): EstimateBuilder;
  addExternalQuery(eqId: string): EstimateBuilder;
  setGeneralSystemCharacteristics(gscValues: number[]): EstimateBuilder;
  setTeamConfiguration(
    teamSize: number,
    hourlyRateBRL: number,
    averageDailyWorkingHours?: number,
  ): EstimateBuilder;
  setProductivityFactor(productivityFactor: number): EstimateBuilder;
  addDocumentReference(document: DocumentReference): EstimateBuilder;
  setNotes(notes: string): EstimateBuilder;
  setStatus(status: EstimateStatus): EstimateBuilder;
  build(): Partial<Estimate>;
}

/**
 * Concrete Builder - Implements step-by-step construction of Estimate
 *
 * This is the core of the Builder pattern. It provides a fluent interface
 * for constructing complex Estimate objects.
 */
export class EstimateBuilder implements IEstimateBuilder {
  private estimate: Partial<Estimate>;
  private componentFunctionPoints: number[] = [];
  private errors: string[] = [];

  constructor() {
    this.reset();
  }

  /**
   * Reset the builder to initial state
   */
  private reset(): void {
    this.estimate = {
      internalLogicalFiles: [],
      externalInterfaceFiles: [],
      externalInputs: [],
      externalOutputs: [],
      externalQueries: [],
      documentReferences: [],
      unadjustedFunctionPoints: 0,
      valueAdjustmentFactor: 1.0,
      adjustedFunctionPoints: 0,
      estimatedEffortHours: 0,
      status: EstimateStatus.DRAFT,
      version: 1,
      averageDailyWorkingHours: 8,
      productivityFactor: 10,
    };
    this.componentFunctionPoints = [];
    this.errors = [];
  }

  /**
   * Step 1: Set basic information (required)
   */
  setBasicInfo(
    name: string,
    description: string,
    projectId: string,
    organizationId: string,
    createdBy: string,
  ): EstimateBuilder {
    if (!name || name.trim().length === 0) {
      this.errors.push('Name is required');
    }
    if (!description || description.trim().length === 0) {
      this.errors.push('Description is required');
    }
    if (!Types.ObjectId.isValid(projectId)) {
      this.errors.push('Invalid project ID');
    }
    if (!Types.ObjectId.isValid(organizationId)) {
      this.errors.push('Invalid organization ID');
    }
    if (!Types.ObjectId.isValid(createdBy)) {
      this.errors.push('Invalid creator ID');
    }

    this.estimate.name = name;
    this.estimate.description = description;
    this.estimate.projectId = new Types.ObjectId(projectId);
    this.estimate.organizationId = new Types.ObjectId(organizationId);
    this.estimate.createdBy = new Types.ObjectId(createdBy);

    return this;
  }

  /**
   * Step 2: Set count type (required)
   */
  setCountType(countType: CountType): EstimateBuilder {
    if (!Object.values(CountType).includes(countType)) {
      this.errors.push('Invalid count type');
    }
    this.estimate.countType = countType;
    return this;
  }

  /**
   * Step 3: Set boundary and scope (required)
   */
  setBoundaryAndScope(
    applicationBoundary: string,
    countingScope: string,
  ): EstimateBuilder {
    if (!applicationBoundary || applicationBoundary.trim().length === 0) {
      this.errors.push('Application boundary is required');
    }
    if (!countingScope || countingScope.trim().length === 0) {
      this.errors.push('Counting scope is required');
    }

    this.estimate.applicationBoundary = applicationBoundary;
    this.estimate.countingScope = countingScope;
    return this;
  }

  /**
   * Step 4: Add FPA components (optional, but typically you'll add some)
   */
  addInternalLogicalFile(aliId: string): EstimateBuilder {
    if (!Types.ObjectId.isValid(aliId)) {
      this.errors.push(`Invalid ALI ID: ${aliId}`);
      return this;
    }
    if (!this.estimate.internalLogicalFiles) {
      this.estimate.internalLogicalFiles = [];
    }
    this.estimate.internalLogicalFiles.push(new Types.ObjectId(aliId));
    return this;
  }

  addExternalInterfaceFile(aieId: string): EstimateBuilder {
    if (!Types.ObjectId.isValid(aieId)) {
      this.errors.push(`Invalid AIE ID: ${aieId}`);
      return this;
    }
    if (!this.estimate.externalInterfaceFiles) {
      this.estimate.externalInterfaceFiles = [];
    }
    this.estimate.externalInterfaceFiles.push(new Types.ObjectId(aieId));
    return this;
  }

  addExternalInput(eiId: string): EstimateBuilder {
    if (!Types.ObjectId.isValid(eiId)) {
      this.errors.push(`Invalid EI ID: ${eiId}`);
      return this;
    }
    if (!this.estimate.externalInputs) {
      this.estimate.externalInputs = [];
    }
    this.estimate.externalInputs.push(new Types.ObjectId(eiId));
    return this;
  }

  addExternalOutput(eoId: string): EstimateBuilder {
    if (!Types.ObjectId.isValid(eoId)) {
      this.errors.push(`Invalid EO ID: ${eoId}`);
      return this;
    }
    if (!this.estimate.externalOutputs) {
      this.estimate.externalOutputs = [];
    }
    this.estimate.externalOutputs.push(new Types.ObjectId(eoId));
    return this;
  }

  addExternalQuery(eqId: string): EstimateBuilder {
    if (!Types.ObjectId.isValid(eqId)) {
      this.errors.push(`Invalid EQ ID: ${eqId}`);
      return this;
    }
    if (!this.estimate.externalQueries) {
      this.estimate.externalQueries = [];
    }
    this.estimate.externalQueries.push(new Types.ObjectId(eqId));
    return this;
  }

  /**
   * Step 5: Set General System Characteristics (optional)
   * If not set, adjustment factor will be 1.0
   */
  setGeneralSystemCharacteristics(gscValues: number[]): EstimateBuilder {
    if (!gscValues) {
      return this;
    }

    if (gscValues.length !== 14) {
      this.errors.push('GSC must have exactly 14 values');
      return this;
    }

    // Validate each GSC value (must be 0-5)
    gscValues.forEach((value, index) => {
      if (value < 0 || value > 5 || !Number.isInteger(value)) {
        this.errors.push(`GSC value ${index + 1} must be an integer between 0 and 5`);
      }
    });

    this.estimate.generalSystemCharacteristics = gscValues;

    // Calculate adjustment factor
    try {
      const ni = FunctionPointCalculator.calculateDegreeOfInfluence(gscValues);
      this.estimate.valueAdjustmentFactor =
        FunctionPointCalculator.calculateAdjustmentFactor(ni);
    } catch (error) {
      this.errors.push(`Failed to calculate adjustment factor: ${error.message}`);
    }

    return this;
  }

  /**
   * Step 6: Set team configuration (required)
   */
  setTeamConfiguration(
    teamSize: number,
    hourlyRateBRL: number,
    averageDailyWorkingHours: number = 8,
  ): EstimateBuilder {
    if (teamSize < 1 || teamSize > 100) {
      this.errors.push('Team size must be between 1 and 100');
    }
    if (hourlyRateBRL < 0.01) {
      this.errors.push('Hourly rate must be positive');
    }
    if (averageDailyWorkingHours < 1 || averageDailyWorkingHours > 24) {
      this.errors.push('Average daily working hours must be between 1 and 24');
    }

    this.estimate.teamSize = teamSize;
    this.estimate.hourlyRateBRL = hourlyRateBRL;
    this.estimate.averageDailyWorkingHours = averageDailyWorkingHours;

    return this;
  }

  /**
   * Step 7: Set productivity factor (optional, defaults to 10)
   */
  setProductivityFactor(productivityFactor: number): EstimateBuilder {
    if (productivityFactor < 1 || productivityFactor > 100) {
      this.errors.push('Productivity factor must be between 1 and 100');
    }

    this.estimate.productivityFactor = productivityFactor;
    return this;
  }

  /**
   * Step 8: Add document references (optional)
   */
  addDocumentReference(document: DocumentReference): EstimateBuilder {
    if (!document.id || !document.name || !document.type) {
      this.errors.push('Document reference must have id, name, and type');
      return this;
    }

    if (!this.estimate.documentReferences) {
      this.estimate.documentReferences = [];
    }
    this.estimate.documentReferences.push(document);
    return this;
  }

  /**
   * Step 9: Set notes (optional)
   */
  setNotes(notes: string): EstimateBuilder {
    this.estimate.notes = notes;
    return this;
  }

  /**
   * Step 10: Set status (optional, defaults to DRAFT)
   */
  setStatus(status: EstimateStatus): EstimateBuilder {
    if (!Object.values(EstimateStatus).includes(status)) {
      this.errors.push('Invalid status');
    }
    this.estimate.status = status;
    return this;
  }

  /**
   * Internal method: Set function points for components
   * This would typically be called after fetching component details from repositories
   */
  setComponentFunctionPoints(functionPoints: number[]): EstimateBuilder {
    this.componentFunctionPoints = functionPoints;
    return this;
  }

  /**
   * Calculate all metrics based on components and configuration
   * This is called internally by build()
   */
  private calculateMetrics(): void {
    try {
      // Calculate PFNA (Unadjusted Function Points)
      this.estimate.unadjustedFunctionPoints =
        FunctionPointCalculator.calculateUnadjustedFunctionPoints(
          this.componentFunctionPoints,
        );

      // Calculate PFA (Adjusted Function Points)
      this.estimate.adjustedFunctionPoints =
        FunctionPointCalculator.calculateAdjustedFunctionPoints(
          this.estimate.unadjustedFunctionPoints,
          this.estimate.valueAdjustmentFactor || 1.0,
        );

      // Calculate effort
      this.estimate.estimatedEffortHours =
        FunctionPointCalculator.calculateEffortHours(
          this.estimate.adjustedFunctionPoints,
          this.estimate.productivityFactor || 10,
        );
    } catch (error) {
      this.errors.push(`Failed to calculate metrics: ${error.message}`);
    }
  }

  /**
   * Validate the complete estimate before building
   */
  private validate(): void {
    // Required fields validation
    if (!this.estimate.name) {
      this.errors.push('Name is required');
    }
    if (!this.estimate.description) {
      this.errors.push('Description is required');
    }
    if (!this.estimate.projectId) {
      this.errors.push('Project ID is required');
    }
    if (!this.estimate.organizationId) {
      this.errors.push('Organization ID is required');
    }
    if (!this.estimate.createdBy) {
      this.errors.push('Creator ID is required');
    }
    if (!this.estimate.countType) {
      this.errors.push('Count type is required');
    }
    if (!this.estimate.applicationBoundary) {
      this.errors.push('Application boundary is required');
    }
    if (!this.estimate.countingScope) {
      this.errors.push('Counting scope is required');
    }
    if (!this.estimate.teamSize) {
      this.errors.push('Team size is required');
    }
    if (!this.estimate.hourlyRateBRL) {
      this.errors.push('Hourly rate is required');
    }
  }

  /**
   * Build the final Estimate object
   * Throws an error if validation fails
   */
  build(): Partial<Estimate> {
    this.validate();

    if (this.errors.length > 0) {
      throw new Error(
        `Cannot build Estimate - validation errors:\n${this.errors.join('\n')}`,
      );
    }

    // Calculate all metrics
    this.calculateMetrics();

    // Return a copy to prevent external modification
    const result = { ...this.estimate };

    // Reset the builder for reuse
    this.reset();

    return result;
  }

  /**
   * Get current errors without building
   */
  getErrors(): string[] {
    return [...this.errors];
  }

  /**
   * Check if builder has errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}

/**
 * Director (Optional) - Encapsulates common construction scenarios
 *
 * The Director knows how to build specific types of estimates using the builder.
 * This is useful for creating preset configurations.
 */
export class EstimateDirector {
  private builder: EstimateBuilder;

  constructor(builder: EstimateBuilder) {
    this.builder = builder;
  }

  /**
   * Create a minimal estimate (just required fields)
   */
  buildMinimalEstimate(
    name: string,
    description: string,
    projectId: string,
    organizationId: string,
    createdBy: string,
    countType: CountType,
    teamSize: number,
    hourlyRate: number,
  ): Partial<Estimate> {
    return this.builder
      .setBasicInfo(name, description, projectId, organizationId, createdBy)
      .setCountType(countType)
      .setBoundaryAndScope(
        'Standard application boundary',
        'Standard counting scope',
      )
      .setTeamConfiguration(teamSize, hourlyRate)
      .build();
  }

  /**
   * Create a complete estimate with all optional fields
   */
  buildCompleteEstimate(params: {
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
    gscValues: number[];
    notes?: string;
  }): Partial<Estimate> {
    this.builder
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
      .setGeneralSystemCharacteristics(params.gscValues);

    if (params.notes) {
      this.builder.setNotes(params.notes);
    }

    return this.builder.build();
  }
}

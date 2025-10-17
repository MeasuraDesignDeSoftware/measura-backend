/**
 * DESIGN PATTERN: Factory Method (Creational - Class Scope)
 *
 * Purpose: Define an interface for creating report objects, but let subclasses decide
 * which concrete report class to instantiate.
 *
 * Pattern Location: This file implements the abstract factory
 * Concrete Factories: PDFReportFactory, DOCXReportFactory, CSVReportFactory, JSONReportFactory
 *
 * GoF Classification: Creational Pattern - Class Scope
 *
 * Justification: The system needs to generate multiple report formats (PDF, DOCX, CSV, JSON)
 * with different creation logic. The Factory Method pattern allows us to delegate the
 * instantiation to subclasses while maintaining a common interface.
 */

import { Estimate } from '@domain/fpa/entities/estimate.entity';

/**
 * Product interface - defines the contract for all report types
 */
export interface IReport {
  generate(estimate: Estimate): Promise<string | Buffer>;
  getFormat(): string;
  getMimeType(): string;
}

/**
 * Abstract Creator - declares the factory method
 * This is the core of the Factory Method pattern
 */
export abstract class ReportFactory {
  /**
   * Factory Method - to be implemented by concrete factories
   * This is the method that subclasses will override to create specific report types
   */
  protected abstract createReport(): IReport;

  /**
   * Business logic that uses the factory method
   * This method depends on the factory method but doesn't need to know
   * which concrete product it's working with
   */
  async generateReport(estimate: Estimate): Promise<{
    content: string | Buffer;
    format: string;
    mimeType: string;
  }> {
    // Call the factory method to create a product
    const report = this.createReport();

    // Use the product
    const content = await report.generate(estimate);

    return {
      content,
      format: report.getFormat(),
      mimeType: report.getMimeType(),
    };
  }

  /**
   * Helper method to validate estimate before generation
   */
  protected validateEstimate(estimate: Estimate): void {
    if (!estimate) {
      throw new Error('Estimate cannot be null or undefined');
    }
    if (!estimate._id) {
      throw new Error('Estimate must have a valid ID');
    }
    if (!estimate.name) {
      throw new Error('Estimate must have a name');
    }
  }
}

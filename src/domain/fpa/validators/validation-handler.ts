/**
 * DESIGN PATTERN: Chain of Responsibility (Behavioral - Object Scope)
 *
 * Purpose: Avoid coupling the sender of a request to its receiver by giving more than
 * one object a chance to handle the request. Chain the receiving objects and pass the
 * request along the chain until an object handles it.
 *
 * Pattern Location: This file defines the abstract handler for validation chain
 * Concrete Handlers: DETValidator, FTRValidator, ComplexityValidator, etc.
 * Client: FPAComponentValidator
 *
 * GoF Classification: Behavioral Pattern - Object Scope
 *
 * Justification: FPA component validation has multiple sequential steps (DET validation,
 * FTR validation, complexity calculation, function point calculation). Each step depends
 * on the previous one. Chain of Responsibility allows each validator to decide whether
 * to process the request or pass it to the next handler, enabling early exit on errors.
 */

/**
 * Validation context - contains all data needed for validation
 */
export interface ValidationContext {
  componentType: 'ALI' | 'AIE' | 'EI' | 'EO' | 'EQ';
  det?: number; // Data Element Types
  ftr?: number; // File Types Referenced (for transactional functions)
  tr?: number; // Record Element Types (for data functions)
  complexity?: string;
  functionPoints?: number;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  context: ValidationContext;
}

/**
 * Abstract Handler - Defines the interface for handling validation requests
 *
 * This is the core of the Chain of Responsibility pattern.
 * Each concrete handler will extend this class.
 */
export abstract class ValidationHandler {
  private nextHandler: ValidationHandler | null = null;

  /**
   * Set the next handler in the chain
   * Returns the handler to allow chaining: handler1.setNext(handler2).setNext(handler3)
   */
  setNext(handler: ValidationHandler): ValidationHandler {
    this.nextHandler = handler;
    return handler;
  }

  /**
   * Template method that defines the validation flow
   * This calls the abstract validate method and then passes to next handler
   */
  async handle(context: ValidationContext): Promise<ValidationResult> {
    // Perform this handler's validation
    await this.validate(context);

    // If validation failed (has errors), stop the chain
    if (context.errors.length > 0) {
      return {
        isValid: false,
        errors: context.errors,
        warnings: context.warnings,
        context,
      };
    }

    // If there's a next handler, pass the context along
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }

    // End of chain - validation passed
    return {
      isValid: true,
      errors: [],
      warnings: context.warnings,
      context,
    };
  }

  /**
   * Abstract method to be implemented by concrete handlers
   * Each handler implements its own validation logic
   */
  protected abstract validate(context: ValidationContext): Promise<void> | void;

  /**
   * Helper method to add an error
   */
  protected addError(context: ValidationContext, error: string): void {
    context.errors.push(error);
  }

  /**
   * Helper method to add a warning
   */
  protected addWarning(context: ValidationContext, warning: string): void {
    context.warnings.push(warning);
  }

  /**
   * Helper method to check if context has a specific metadata key
   */
  protected hasMetadata(context: ValidationContext, key: string): boolean {
    return context.metadata && key in context.metadata;
  }

  /**
   * Helper method to get metadata
   */
  protected getMetadata<T>(context: ValidationContext, key: string): T | undefined {
    return context.metadata ? (context.metadata[key] as T) : undefined;
  }

  /**
   * Helper method to set metadata
   */
  protected setMetadata(
    context: ValidationContext,
    key: string,
    value: any,
  ): void {
    if (!context.metadata) {
      context.metadata = {};
    }
    context.metadata[key] = value;
  }
}

/**
 * Null Handler - Terminal handler that does nothing
 * Useful for ending chains explicitly
 */
export class NullValidationHandler extends ValidationHandler {
  protected validate(context: ValidationContext): void {
    // Do nothing - this is the end of the chain
  }
}

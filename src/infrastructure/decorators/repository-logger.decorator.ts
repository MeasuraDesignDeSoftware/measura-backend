/**
 * DESIGN PATTERN: Decorator (Structural - Object Scope)
 *
 * Purpose: Attach additional responsibilities to repository objects dynamically.
 * Decorators provide a flexible alternative to subclassing for extending functionality.
 *
 * Pattern Location: This file implements logging decorator for repositories
 * Component Interface: IBaseRepository
 * Concrete Component: Any repository implementation (UserRepository, ProjectRepository, etc.)
 * Decorator: LoggingRepositoryDecorator
 *
 * GoF Classification: Structural Pattern - Object Scope
 *
 * Justification: Cross-cutting concerns like logging should not pollute domain repositories.
 * The Decorator pattern allows us to add logging behavior transparently without modifying
 * the original repository classes. Multiple decorators can be stacked (logging + caching).
 */

import { Logger } from '@nestjs/common';
import { IBaseRepository } from '@shared/interfaces/base-repository.interface';

/**
 * Concrete Decorator - Adds logging to repository operations
 *
 * This decorator wraps any IBaseRepository implementation and logs all operations,
 * including execution time, parameters, and results.
 */
export class LoggingRepositoryDecorator<T> implements IBaseRepository<T> {
  private readonly logger: Logger;
  private readonly repositoryName: string;

  /**
   * Constructor takes the component to decorate
   * @param repository - The repository to add logging to
   * @param repositoryName - Name for logging context
   */
  constructor(
    private readonly repository: IBaseRepository<T>,
    repositoryName: string,
  ) {
    this.repositoryName = repositoryName;
    this.logger = new Logger(`${repositoryName}[Logged]`);
  }

  /**
   * Wrap create operation with logging
   */
  async create(entity: Partial<T>): Promise<T> {
    const startTime = Date.now();
    this.logger.log(
      `Creating entity in ${this.repositoryName} with data: ${JSON.stringify(entity, null, 2)}`,
    );

    try {
      const result = await this.repository.create(entity);
      const duration = Date.now() - startTime;

      this.logger.log(
        `Successfully created entity in ${this.repositoryName} (${duration}ms)`,
      );
      this.logger.debug(`Created entity: ${JSON.stringify(result)}`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to create entity in ${this.repositoryName} (${duration}ms): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Wrap findById operation with logging
   */
  async findById(id: string): Promise<T | null> {
    const startTime = Date.now();
    this.logger.log(`Finding entity by ID in ${this.repositoryName}: ${id}`);

    try {
      const result = await this.repository.findById(id);
      const duration = Date.now() - startTime;

      if (result) {
        this.logger.log(
          `Found entity by ID in ${this.repositoryName} (${duration}ms)`,
        );
        this.logger.debug(`Found entity: ${JSON.stringify(result)}`);
      } else {
        this.logger.warn(
          `Entity not found by ID in ${this.repositoryName}: ${id} (${duration}ms)`,
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to find entity by ID in ${this.repositoryName} (${duration}ms): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Wrap findAll operation with logging
   */
  async findAll(): Promise<T[]> {
    const startTime = Date.now();
    this.logger.log(`Finding all entities in ${this.repositoryName}`);

    try {
      const result = await this.repository.findAll();
      const duration = Date.now() - startTime;

      this.logger.log(
        `Found ${result.length} entities in ${this.repositoryName} (${duration}ms)`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to find all entities in ${this.repositoryName} (${duration}ms): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Wrap update operation with logging
   */
  async update(id: string, entity: Partial<T>): Promise<T | null> {
    const startTime = Date.now();
    this.logger.log(
      `Updating entity in ${this.repositoryName} with ID: ${id}`,
    );
    this.logger.debug(`Update data: ${JSON.stringify(entity, null, 2)}`);

    try {
      const result = await this.repository.update(id, entity);
      const duration = Date.now() - startTime;

      if (result) {
        this.logger.log(
          `Successfully updated entity in ${this.repositoryName} (${duration}ms)`,
        );
        this.logger.debug(`Updated entity: ${JSON.stringify(result)}`);
      } else {
        this.logger.warn(
          `Entity not found for update in ${this.repositoryName}: ${id} (${duration}ms)`,
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to update entity in ${this.repositoryName} (${duration}ms): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Wrap delete operation with logging
   */
  async delete(id: string): Promise<boolean> {
    const startTime = Date.now();
    this.logger.log(`Deleting entity from ${this.repositoryName} with ID: ${id}`);

    try {
      const result = await this.repository.delete(id);
      const duration = Date.now() - startTime;

      if (result) {
        this.logger.log(
          `Successfully deleted entity from ${this.repositoryName} (${duration}ms)`,
        );
      } else {
        this.logger.warn(
          `Entity not found for deletion in ${this.repositoryName}: ${id} (${duration}ms)`,
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to delete entity from ${this.repositoryName} (${duration}ms): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get access to the wrapped repository
   * Useful for accessing repository-specific methods not in the interface
   */
  getWrappedRepository(): IBaseRepository<T> {
    return this.repository;
  }
}

/**
 * Utility function to create a logged repository
 * This makes it easier to apply the decorator
 */
export function withLogging<T>(
  repository: IBaseRepository<T>,
  name: string,
): IBaseRepository<T> {
  return new LoggingRepositoryDecorator(repository, name);
}

/**
 * DESIGN PATTERN: Decorator (Structural - Object Scope)
 *
 * Pattern Location: This file implements caching decorator for repositories
 * Component Interface: IBaseRepository
 * Decorator: CachingRepositoryDecorator
 *
 * This decorator can be stacked with LoggingRepositoryDecorator to provide
 * both logging and caching functionality.
 *
 * Example of decorator stacking:
 *   const repo = new CachingRepositoryDecorator(
 *     new LoggingRepositoryDecorator(baseRepo, 'User'),
 *     'User',
 *     60000 // 1 minute TTL
 *   );
 */

import { Logger } from '@nestjs/common';
import { IBaseRepository } from '@shared/interfaces/base-repository.interface';

/**
 * Simple cache entry with TTL (Time To Live)
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Concrete Decorator - Adds caching to repository read operations
 *
 * This decorator caches read operations (findById, findAll) to reduce database load.
 * Write operations (create, update, delete) invalidate the cache to maintain consistency.
 */
export class CachingRepositoryDecorator<T> implements IBaseRepository<T> {
  private readonly logger: Logger;
  private readonly cache: Map<string, CacheEntry<T | T[] | null>>;
  private readonly repositoryName: string;
  private readonly ttl: number; // Time to live in milliseconds

  /**
   * Constructor
   * @param repository - The repository to add caching to
   * @param repositoryName - Name for logging context
   * @param ttl - Cache time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(
    private readonly repository: IBaseRepository<T>,
    repositoryName: string,
    ttl: number = 300000, // 5 minutes default
  ) {
    this.repositoryName = repositoryName;
    this.ttl = ttl;
    this.cache = new Map();
    this.logger = new Logger(`${repositoryName}[Cached]`);

    // Periodically clean expired cache entries
    this.startCacheCleanup();
  }

  /**
   * Get cache key for a specific operation
   */
  private getCacheKey(operation: string, id?: string): string {
    return id ? `${operation}:${id}` : operation;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from cache
   */
  private getFromCache<R>(key: string): R | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (!this.isCacheValid(entry)) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired for key: ${key}`);
      return undefined;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.data as R;
  }

  /**
   * Store data in cache
   */
  private setInCache<R>(key: string, data: R): void {
    this.cache.set(key, {
      data: data as any,
      timestamp: Date.now(),
      ttl: this.ttl,
    });
    this.logger.debug(`Cached data for key: ${key}`);
  }

  /**
   * Invalidate cache for specific patterns
   */
  private invalidateCache(pattern?: string): void {
    if (!pattern) {
      // Clear entire cache
      this.cache.clear();
      this.logger.debug('Entire cache invalidated');
      return;
    }

    // Clear specific entries matching pattern
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    if (keysToDelete.length > 0) {
      this.logger.debug(
        `Invalidated ${keysToDelete.length} cache entries matching: ${pattern}`,
      );
    }
  }

  /**
   * Periodically clean up expired cache entries
   */
  private startCacheCleanup(): void {
    setInterval(
      () => {
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, entry] of this.cache.entries()) {
          if (now - entry.timestamp >= entry.ttl) {
            this.cache.delete(key);
            expiredCount++;
          }
        }

        if (expiredCount > 0) {
          this.logger.debug(
            `Cleaned up ${expiredCount} expired cache entries`,
          );
        }
      },
      this.ttl / 2,
    ); // Run cleanup at half the TTL interval
  }

  /**
   * Create - Invalidates cache
   */
  async create(entity: Partial<T>): Promise<T> {
    const result = await this.repository.create(entity);
    this.invalidateCache(); // Invalidate all cache on create
    return result;
  }

  /**
   * Find by ID - Uses cache
   */
  async findById(id: string): Promise<T | null> {
    const cacheKey = this.getCacheKey('findById', id);
    const cached = this.getFromCache<T | null>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const result = await this.repository.findById(id);
    this.setInCache(cacheKey, result);
    return result;
  }

  /**
   * Find all - Uses cache
   */
  async findAll(): Promise<T[]> {
    const cacheKey = this.getCacheKey('findAll');
    const cached = this.getFromCache<T[]>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const result = await this.repository.findAll();
    this.setInCache(cacheKey, result);
    return result;
  }

  /**
   * Update - Invalidates cache
   */
  async update(id: string, entity: Partial<T>): Promise<T | null> {
    const result = await this.repository.update(id, entity);
    this.invalidateCache(); // Invalidate all cache on update
    return result;
  }

  /**
   * Delete - Invalidates cache
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    this.invalidateCache(); // Invalidate all cache on delete
    return result;
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.invalidateCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get access to the wrapped repository
   */
  getWrappedRepository(): IBaseRepository<T> {
    return this.repository;
  }
}

/**
 * Utility function to create a cached repository
 */
export function withCaching<T>(
  repository: IBaseRepository<T>,
  name: string,
  ttl?: number,
): IBaseRepository<T> {
  return new CachingRepositoryDecorator(repository, name, ttl);
}

/**
 * Utility function to create a repository with both logging and caching
 * This demonstrates decorator stacking
 */
export function withLoggingAndCaching<T>(
  repository: IBaseRepository<T>,
  name: string,
  cacheTTL?: number,
): IBaseRepository<T> {
  // Import dynamically to avoid circular dependency
  const { LoggingRepositoryDecorator } = require('./repository-logger.decorator');

  // Stack decorators: first logging, then caching
  // This way, cache hits/misses are also logged
  const logged = new LoggingRepositoryDecorator(repository, name);
  return new CachingRepositoryDecorator(logged, name, cacheTTL);
}

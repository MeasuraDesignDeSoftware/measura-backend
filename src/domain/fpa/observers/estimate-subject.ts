/**
 * DESIGN PATTERN: Observer (Behavioral - Object Scope)
 *
 * Pattern Location: Concrete Subject implementation
 * This class maintains a list of observers and notifies them of changes
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  IEstimateObserver,
  IEstimateSubject,
  EstimateStatusChangeEvent,
} from './estimate-observer.interface';

/**
 * Concrete Subject - Manages observers and notifies them of estimate changes
 *
 * This is the central component of the Observer pattern that maintains
 * the list of observers and handles notifications.
 */
@Injectable()
export class EstimateSubject implements IEstimateSubject {
  private readonly observers: Set<IEstimateObserver> = new Set();
  private readonly logger = new Logger(EstimateSubject.name);

  /**
   * Attach an observer to the subject
   * Observers are stored in a Set to prevent duplicates
   */
  attach(observer: IEstimateObserver): void {
    this.observers.add(observer);
    const name = observer.getName?.() || 'Unknown Observer';
    this.logger.log(`Observer attached: ${name} (Total: ${this.observers.size})`);
  }

  /**
   * Detach an observer from the subject
   */
  detach(observer: IEstimateObserver): void {
    const wasDeleted = this.observers.delete(observer);
    if (wasDeleted) {
      const name = observer.getName?.() || 'Unknown Observer';
      this.logger.log(
        `Observer detached: ${name} (Remaining: ${this.observers.size})`,
      );
    }
  }

  /**
   * Detach all observers
   */
  detachAll(): void {
    this.observers.clear();
    this.logger.log('All observers detached');
  }

  /**
   * Notify all observers of an estimate status change
   * Observers are notified asynchronously and errors in one observer
   * don't affect others
   */
  async notify(event: EstimateStatusChangeEvent): Promise<void> {
    this.logger.log(
      `Notifying ${this.observers.size} observers about estimate ${event.estimate._id} status change: ${event.previousStatus} → ${event.newStatus}`,
    );

    const notificationPromises: Promise<void>[] = [];

    for (const observer of this.observers) {
      // Check if observer wants to be notified about this event
      if (observer.shouldNotify && !observer.shouldNotify(event)) {
        const name = observer.getName?.() || 'Unknown Observer';
        this.logger.debug(
          `Observer ${name} skipped notification based on shouldNotify filter`,
        );
        continue;
      }

      // Notify observer asynchronously
      const notificationPromise = this.notifyObserver(observer, event);
      notificationPromises.push(notificationPromise);
    }

    // Wait for all notifications to complete
    // Using Promise.allSettled to ensure all observers are notified
    // even if some fail
    const results = await Promise.allSettled(notificationPromises);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Observer notification failed: ${result.reason}`,
          result.reason?.stack,
        );
      }
    });

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Notification complete: ${successCount} succeeded, ${failureCount} failed`,
    );
  }

  /**
   * Notify a single observer with error handling
   */
  private async notifyObserver(
    observer: IEstimateObserver,
    event: EstimateStatusChangeEvent,
  ): Promise<void> {
    const name = observer.getName?.() || 'Unknown Observer';

    try {
      this.logger.debug(`Notifying observer: ${name}`);
      const startTime = Date.now();

      await Promise.resolve(observer.update(event));

      const duration = Date.now() - startTime;
      this.logger.debug(`Observer ${name} notified successfully (${duration}ms)`);
    } catch (error) {
      this.logger.error(
        `Observer ${name} notification failed: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to be caught by Promise.allSettled
    }
  }

  /**
   * Get the number of attached observers
   */
  getObserverCount(): number {
    return this.observers.size;
  }

  /**
   * Get names of all attached observers (for debugging)
   */
  getObserverNames(): string[] {
    return Array.from(this.observers).map(
      (observer) => observer.getName?.() || 'Unknown Observer',
    );
  }
}

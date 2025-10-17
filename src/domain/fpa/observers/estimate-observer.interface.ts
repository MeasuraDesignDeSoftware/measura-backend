/**
 * DESIGN PATTERN: Observer (Behavioral - Object Scope)
 *
 * Purpose: Define a one-to-many dependency between objects so that when one object
 * changes state, all its dependents are notified and updated automatically.
 *
 * Pattern Location: This file defines the Observer interface
 * Subject: EstimateSubject
 * Concrete Observers: EmailNotificationObserver, LogObserver, AuditObserver
 *
 * GoF Classification: Behavioral Pattern - Object Scope
 *
 * Justification: When an estimate changes status (e.g., DRAFT → FINALIZED → ARCHIVED),
 * multiple actions need to occur: send email notifications, log the event, update audit
 * trail, trigger webhooks, etc. The Observer pattern decouples the estimate entity from
 * these actions, making it easy to add/remove notifications without modifying the core logic.
 */

import { Estimate, EstimateStatus } from '@domain/fpa/entities/estimate.entity';

/**
 * Event data passed to observers when estimate status changes
 */
export interface EstimateStatusChangeEvent {
  estimate: Estimate;
  previousStatus: EstimateStatus;
  newStatus: EstimateStatus;
  changedBy: string; // User ID who made the change
  changedAt: Date;
  reason?: string; // Optional reason for the change
  metadata?: Record<string, any>;
}

/**
 * Observer Interface - All concrete observers must implement this
 *
 * This is the core interface of the Observer pattern.
 * Any class that wants to be notified of estimate changes must implement this.
 */
export interface IEstimateObserver {
  /**
   * Called when the estimate status changes
   * @param event - Details about the status change
   */
  update(event: EstimateStatusChangeEvent): Promise<void> | void;

  /**
   * Optional: Get observer name for logging/debugging
   */
  getName?(): string;

  /**
   * Optional: Filter which events this observer cares about
   * Return true to receive the notification, false to ignore it
   */
  shouldNotify?(event: EstimateStatusChangeEvent): boolean;
}

/**
 * Subject Interface - The object being observed
 */
export interface IEstimateSubject {
  /**
   * Attach an observer
   */
  attach(observer: IEstimateObserver): void;

  /**
   * Detach an observer
   */
  detach(observer: IEstimateObserver): void;

  /**
   * Notify all observers of a status change
   */
  notify(event: EstimateStatusChangeEvent): Promise<void>;
}

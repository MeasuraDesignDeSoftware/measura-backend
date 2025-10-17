/**
 * DESIGN PATTERN: Observer (Behavioral - Object Scope)
 *
 * Pattern Location: Concrete Observer - Email Notifications
 * Implements: IEstimateObserver
 *
 * This observer sends email notifications when estimate status changes
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  IEstimateObserver,
  EstimateStatusChangeEvent,
} from './estimate-observer.interface';
import { EstimateStatus } from '@domain/fpa/entities/estimate.entity';
import { EmailService } from '@infrastructure/external-services/email/email.service';

/**
 * Concrete Observer - Sends email notifications
 *
 * This is a concrete implementation of the Observer pattern that handles
 * email notifications when estimate status changes.
 */
@Injectable()
export class EmailNotificationObserver implements IEstimateObserver {
  private readonly logger = new Logger(EmailNotificationObserver.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Implement the Observer interface
   * Called when estimate status changes
   */
  async update(event: EstimateStatusChangeEvent): Promise<void> {
    this.logger.log(
      `Processing email notification for estimate ${event.estimate._id}: ${event.previousStatus} → ${event.newStatus}`,
    );

    try {
      // Determine email subject and content based on status change
      const emailContent = this.buildEmailContent(event);

      // TODO: Fetch user email from repository using event.changedBy
      // For now, we'll just log what would be sent
      this.logger.log(
        `Would send email to user ${event.changedBy}:\n` +
          `Subject: ${emailContent.subject}\n` +
          `Body: ${emailContent.body}`,
      );

      // Uncomment when ready to send actual emails
      // const user = await this.userRepository.findById(event.changedBy);
      // if (user && user.email) {
      //   await this.emailService.sendEmail(
      //     user.email,
      //     emailContent.subject,
      //     emailContent.body
      //   );
      // }
    } catch (error) {
      this.logger.error(
        `Failed to send email notification: ${error.message}`,
        error.stack,
      );
      // Don't throw - we don't want email failures to break the system
    }
  }

  /**
   * Filter: Only notify for status changes to FINALIZED or ARCHIVED
   */
  shouldNotify(event: EstimateStatusChangeEvent): boolean {
    const importantStatuses = [EstimateStatus.FINALIZED, EstimateStatus.ARCHIVED];
    return importantStatuses.includes(event.newStatus);
  }

  /**
   * Get observer name for logging
   */
  getName(): string {
    return 'EmailNotificationObserver';
  }

  /**
   * Build email content based on status change
   */
  private buildEmailContent(event: EstimateStatusChangeEvent): {
    subject: string;
    body: string;
  } {
    const estimateName = event.estimate.name;
    const changeType = `${event.previousStatus} → ${event.newStatus}`;

    let subject: string;
    let body: string;

    switch (event.newStatus) {
      case EstimateStatus.FINALIZED:
        subject = `Estimate Finalized: ${estimateName}`;
        body = `
          <div style="font-family: Arial, sans-serif;">
            <h2>Estimate Finalized</h2>
            <p>The estimate "${estimateName}" has been finalized.</p>

            <h3>Summary:</h3>
            <ul>
              <li><strong>Adjusted Function Points:</strong> ${event.estimate.adjustedFunctionPoints}</li>
              <li><strong>Estimated Effort:</strong> ${event.estimate.estimatedEffortHours} hours</li>
              <li><strong>Previous Status:</strong> ${event.previousStatus}</li>
              <li><strong>Changed At:</strong> ${event.changedAt.toLocaleString()}</li>
            </ul>

            ${event.reason ? `<p><strong>Reason:</strong> ${event.reason}</p>` : ''}

            <p>You can review the estimate details in the system.</p>
          </div>
        `;
        break;

      case EstimateStatus.ARCHIVED:
        subject = `Estimate Archived: ${estimateName}`;
        body = `
          <div style="font-family: Arial, sans-serif;">
            <h2>Estimate Archived</h2>
            <p>The estimate "${estimateName}" has been archived.</p>

            <p><strong>Previous Status:</strong> ${event.previousStatus}</p>
            <p><strong>Archived At:</strong> ${event.changedAt.toLocaleString()}</p>

            ${event.reason ? `<p><strong>Reason:</strong> ${event.reason}</p>` : ''}

            <p>Archived estimates can be restored if needed.</p>
          </div>
        `;
        break;

      default:
        subject = `Estimate Status Changed: ${estimateName}`;
        body = `
          <div style="font-family: Arial, sans-serif;">
            <h2>Estimate Status Updated</h2>
            <p>The estimate "${estimateName}" status has changed.</p>
            <p><strong>Change:</strong> ${changeType}</p>
            <p><strong>Changed At:</strong> ${event.changedAt.toLocaleString()}</p>
            ${event.reason ? `<p><strong>Reason:</strong> ${event.reason}</p>` : ''}
          </div>
        `;
    }

    return { subject, body };
  }
}

/**
 * Concrete Observer - Logs status changes
 * Simpler observer that just logs the event
 */
@Injectable()
export class LogObserver implements IEstimateObserver {
  private readonly logger = new Logger(LogObserver.name);

  update(event: EstimateStatusChangeEvent): void {
    this.logger.log(
      `[AUDIT] Estimate ${event.estimate._id} (${event.estimate.name}) ` +
        `status changed: ${event.previousStatus} → ${event.newStatus} ` +
        `by user ${event.changedBy} at ${event.changedAt.toISOString()}` +
        (event.reason ? ` (Reason: ${event.reason})` : ''),
    );
  }

  getName(): string {
    return 'LogObserver';
  }
}

/**
 * Concrete Observer - Audit trail
 * Stores status changes in an audit table (implementation placeholder)
 */
@Injectable()
export class AuditObserver implements IEstimateObserver {
  private readonly logger = new Logger(AuditObserver.name);

  async update(event: EstimateStatusChangeEvent): Promise<void> {
    // TODO: Implement actual audit trail storage
    // This would typically save to an audit_trail table
    const auditEntry = {
      entityType: 'Estimate',
      entityId: event.estimate._id.toString(),
      action: 'STATUS_CHANGE',
      previousValue: event.previousStatus,
      newValue: event.newStatus,
      changedBy: event.changedBy,
      changedAt: event.changedAt,
      reason: event.reason,
      metadata: event.metadata,
    };

    this.logger.debug(
      `Audit entry created: ${JSON.stringify(auditEntry, null, 2)}`,
    );

    // await this.auditRepository.create(auditEntry);
  }

  getName(): string {
    return 'AuditObserver';
  }

  // Only audit FINALIZED and ARCHIVED status changes
  shouldNotify(event: EstimateStatusChangeEvent): boolean {
    return event.newStatus !== EstimateStatus.DRAFT;
  }
}

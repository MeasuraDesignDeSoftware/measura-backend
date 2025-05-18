import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('app.email.host');
    const port = this.configService.get<number>('app.email.port');
    const user = this.configService.get<string>('app.email.user');
    const pass = this.configService.get<string>('app.email.pass');
    this.from =
      this.configService.get<string>('app.email.from') ||
      'Measura <no-reply@measura.com>';
    this.frontendUrl =
      this.configService.get<string>('app.email.frontendUrl') ||
      'http://localhost:3000';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    this.verifyConnection().catch((error) => {
      this.logger.error(
        `Failed to establish SMTP connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    });
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection established successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to establish SMTP connection: ${errorMessage}`);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      // Send the email and capture the result
      // We'll use a simpler approach avoiding issues with the messageId type
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });

      // Log the email sending without using messageId
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${errorMessage}`);
      return false;
    }
  }

  async sendVerificationEmail(
    to: string,
    verificationToken: string,
  ): Promise<boolean> {
    const verificationUrl = `${this.frontendUrl}/auth/verify-email/${verificationToken}`;
    const subject = 'Verify Your Email Address';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Measura!</h2>
        <p>Thank you for registering with us. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
             Verify Email
          </a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The Measura Team</p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password/${resetToken}`;
    const subject = 'Reset Your Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
             Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The Measura Team</p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }
}

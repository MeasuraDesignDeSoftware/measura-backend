import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly frontendUrl: string;
  private isConfigValid = false;
  private readonly templatesDir: string;
  private defaultTemplates: Record<string, string>;

  constructor(private readonly configService: ConfigService) {
    this.templatesDir = path.join(
      process.cwd(),
      'src/infrastructure/external-services/email/templates',
    );

    this.defaultTemplates = {
      'verification-email': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Measura!</h2>
          <p>Thank you for registering with us. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
               Verify Email
            </a>
          </div>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>Best regards,<br>The Measura Team</p>
        </div>
      `,
      'password-reset': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
               Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p><a href="{{resetUrl}}">{{resetUrl}}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>The Measura Team</p>
        </div>
      `,
    };

    const host = this.configService.get<string>('app.email.host');
    const port = this.configService.get<string | number>('app.email.port');
    const user = this.configService.get<string>('app.email.user');
    const pass = this.configService.get<string>('app.email.pass');

    this.from =
      this.configService.get<string>('app.email.from') ||
      'Measura <no-reply@measura.com>';
    this.frontendUrl =
      this.configService.get<string>('app.email.frontendUrl') ||
      'http://localhost:3000';

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email service not properly configured: missing SMTP credentials / host / port',
      );
      return;
    }

    try {
      let portNumber: number;

      if (typeof port === 'string') {
        portNumber = parseInt(port, 10);
        if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
          throw new Error(`Invalid SMTP port number: ${port}`);
        }
      } else {
        portNumber = port;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port: portNumber,
        secure: portNumber === 465,
        auth: user && pass ? { user, pass } : undefined,
      });

      this.verifyConnection()
        .then(() => {
          this.isConfigValid = true;
        })
        .catch((error) => {
          this.logger.error(
            `Failed to establish SMTP connection: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        });
    } catch (error) {
      this.logger.error(
        `Failed to initialize email transporter: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async verifyConnection(): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

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

  private async ensureTemplateDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      this.logger.error(
        `Failed to create templates directory: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async getTemplate(
    templateName: string,
    replacements: Record<string, string>,
  ): Promise<string> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);

      await this.ensureTemplateDirectoryExists();

      let template: string;

      try {
        template = await fs.readFile(templatePath, 'utf8');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          const defaultContent = this.defaultTemplates[templateName] || '';
          await fs.writeFile(templatePath, defaultContent);
          template = defaultContent;
        } else {
          throw err;
        }
      }

      Object.entries(replacements).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return template;
    } catch (error) {
      this.logger.error(
        `Failed to load email template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (templateName === 'verification-email') {
        return `
          <div>
            <h2>Verify Your Email</h2>
            <p>Please verify your email by clicking <a href="${replacements.verificationUrl}">here</a>.</p>
          </div>
        `;
      } else if (templateName === 'password-reset') {
        return `
          <div>
            <h2>Reset Your Password</h2>
            <p>Reset your password by clicking <a href="${replacements.resetUrl}">here</a>.</p>
          </div>
        `;
      }
      return '';
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.isConfigValid || !this.transporter) {
      const errorMessage =
        'Email service not properly initialized, cannot send email';
      this.logger.warn(errorMessage);
      throw new ServiceUnavailableException(errorMessage);
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${errorMessage}`);
      throw new ServiceUnavailableException(
        `Failed to send email: ${errorMessage}`,
      );
    }
  }

  async sendVerificationEmail(
    to: string,
    verificationToken: string,
  ): Promise<boolean> {
    const encodedToken = encodeURIComponent(verificationToken);
    const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${encodedToken}`;
    const subject = 'Verify Your Email Address';

    const html = await this.getTemplate('verification-email', {
      verificationUrl,
    });

    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<boolean> {
    const encodedToken = encodeURIComponent(resetToken);
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${encodedToken}`;
    const subject = 'Reset Your Password';

    const html = await this.getTemplate('password-reset', { resetUrl });

    return this.sendEmail(to, subject, html);
  }
}

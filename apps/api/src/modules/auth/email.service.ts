import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendVerificationEmailInput {
  email: string;
  displayName: string;
  code: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM') ?? 'LexiRoot <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.log(`Email verification code for ${input.email}: ${input.code}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: input.email,
        subject: 'Your LexiRoot verification code',
        html: this.renderVerificationHtml(input.displayName, input.code),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Could not send verification email to ${input.email}: ${body}`);
    }
  }

  private renderVerificationHtml(displayName: string, code: string): string {
    const safeName = escapeHtml(displayName);
    const safeCode = escapeHtml(code);
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222; max-width: 480px;">
        <h1 style="font-size: 24px; color: #e84f38;">Confirm your email</h1>
        <p>Hi ${safeName},</p>
        <p>Use this 6-digit code in the LexiRoot app to confirm your email address:</p>
        <p style="margin: 24px 0;">
          <span style="display: inline-block; padding: 16px 24px; background: #f6f1ee; color: #222; font-size: 28px; font-weight: 700; letter-spacing: 8px; border-radius: 12px; font-family: 'Menlo', 'Consolas', monospace;">
            ${safeCode}
          </span>
        </p>
        <p style="font-size: 13px; color: #666;">This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

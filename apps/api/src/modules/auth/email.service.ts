import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendVerificationEmailInput {
  email: string;
  displayName: string;
  verificationUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM') ?? 'LexiRoot <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.log(`Email verification link for ${input.email}: ${input.verificationUrl}`);
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
        subject: 'Confirm your LexiRoot email',
        html: this.renderVerificationHtml(input.displayName, input.verificationUrl),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Could not send verification email to ${input.email}: ${body}`);
    }
  }

  private renderVerificationHtml(displayName: string, verificationUrl: string): string {
    const safeName = escapeHtml(displayName);
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
        <h1 style="font-size: 24px;">Confirm your email</h1>
        <p>Hi ${safeName},</p>
        <p>Open this link to confirm your LexiRoot account:</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 18px; background: #e84f38; color: #fff; text-decoration: none; border-radius: 8px;">
            Confirm email
          </a>
        </p>
        <p>If the button does not work, copy and paste this link:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
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

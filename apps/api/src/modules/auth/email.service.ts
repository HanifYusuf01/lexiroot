import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ADMIN_ROLE_LABELS, type AdminRole } from '@lexiroot/shared';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';

const BRAND_COLOR = '#e35336';
const TEXT_COLOR = '#3c3c3c';
const MUTED_COLOR = '#7a7878';
const PANEL_BG = '#f6f1ee';

interface SendVerificationEmailInput {
  email: string;
  displayName: string;
  code: string;
}

interface SendAdminInvitationEmailInput {
  email: string;
  displayName: string;
  role: AdminRole;
  inviteUrl: string;
}

interface SendFamilyInvitationEmailInput {
  email: string;
  inviterName: string;
  planName: string;
  inviteUrl: string;
  expiresInDays: number;
}

interface SendFriendInvitationEmailInput {
  email: string;
  inviterName: string;
  inviteUrl: string;
  expiresInDays: number;
}

interface SendFamilySeatRemovedEmailInput {
  email: string;
  displayName: string;
  /** Whoever owned the plan, for "removed from *whose* plan". */
  ownerName: string;
  planName: string;
  /**
   * Why the seat ended: the owner removed them, or the owner moved to a plan
   * that no longer shares. Both end access; only one is about them.
   */
  reason: 'removed' | 'plan_changed';
}

interface SendWelcomeEmailInput {
  email: string;
  displayName: string;
}

interface SendPasswordResetEmailInput {
  email: string;
  displayName: string;
  code: string;
}

interface SendSubscriptionConfirmationEmailInput {
  email: string;
  displayName: string;
  planName: string;
}

interface SendInactivityReengagementEmailInput {
  email: string;
  displayName: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
    await this.send({
      to: input.email,
      subject: 'Your LexiRoot verification code',
      devHint: `code: ${input.code}`,
      html: await this.layout({
        heading: 'Confirm your email',
        bodyHtml: `
          <p>Hi ${escapeHtml(input.displayName)},</p>
          <p>Use this 6-digit code in the LexiRoot app to confirm your email address:</p>
          ${this.codeBlock(input.code)}
          <p style="font-size:13px;color:${MUTED_COLOR};">This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>
        `,
      }),
    });
  }

  async sendAdminInvitationEmail(input: SendAdminInvitationEmailInput): Promise<void> {
    await this.send({
      to: input.email,
      subject: 'You have been invited to the LexiRoot dashboard',
      devHint: `invite url: ${input.inviteUrl}`,
      html: await this.layout({
        heading: 'Join the LexiRoot team',
        bodyHtml: `
          <p>Hi ${escapeHtml(input.displayName)},</p>
          <p>You have been invited to the LexiRoot admin dashboard as a <strong>${escapeHtml(
            ADMIN_ROLE_LABELS[input.role],
          )}</strong>. Set your password to activate your account.</p>
          ${this.button('Accept invitation', input.inviteUrl)}
          <p style="font-size:13px;color:${MUTED_COLOR};">This invitation expires in 7 days. If you weren't expecting it, you can ignore this email.</p>
        `,
      }),
    });
  }

  async sendFamilyInvitationEmail(input: SendFamilyInvitationEmailInput): Promise<void> {
    await this.send({
      to: input.email,
      subject: `${input.inviterName} invited you to their LexiRoot family plan`,
      devHint: `family invite url: ${input.inviteUrl}`,
      html: await this.layout({
        heading: 'Join the family plan',
        bodyHtml: `
          <p><strong>${escapeHtml(input.inviterName)}</strong> has invited you to their LexiRoot
          <strong>${escapeHtml(input.planName)}</strong> plan.</p>
          <p>You'll get your own account with your own languages, streak and progress — the
          plan is shared, your learning isn't.</p>
          ${this.button('Accept invitation', input.inviteUrl)}
          <p style="font-size:13px;color:${MUTED_COLOR};">This invitation expires in ${input.expiresInDays} days and can only be accepted from this email address. If you weren't expecting it, you can ignore this email.</p>
        `,
      }),
    });
  }

  async sendFriendInvitationEmail(input: SendFriendInvitationEmailInput): Promise<void> {
    await this.send({
      to: input.email,
      subject: `${input.inviterName} wants to learn with you on LexiRoot`,
      devHint: `friend invite url: ${input.inviteUrl}`,
      html: await this.layout({
        heading: 'Learn together',
        bodyHtml: `
          <p><strong>${escapeHtml(input.inviterName)}</strong> would like to add you as a friend on
          LexiRoot, so you can see each other on the weekly leaderboard.</p>
          <p>Nothing is shared but your display name, streak and Root Points — never your email,
          your lessons or anything else on your account.</p>
          ${this.button('Accept invitation', input.inviteUrl)}
          <p style="font-size:13px;color:${MUTED_COLOR};">This invitation expires in ${input.expiresInDays} days and can only be accepted from this email address. If you weren't expecting it, you can ignore this email.</p>
        `,
      }),
    });
  }

  /**
   * Tell someone their family-plan seat has ended.
   *
   * Without this the only signal is the app quietly locking, which reads as
   * "you were never subscribed" rather than "your seat ended" — so the two
   * things worth saying are what happened and that nothing of theirs was lost.
   */
  async sendFamilySeatRemovedEmail(input: SendFamilySeatRemovedEmailInput): Promise<void> {
    const cause =
      input.reason === 'plan_changed'
        ? `<strong>${escapeHtml(input.ownerName)}</strong> has moved off the
           <strong>${escapeHtml(input.planName)}</strong> plan you shared, so your seat on it has ended.`
        : `<strong>${escapeHtml(input.ownerName)}</strong> has removed your seat on their
           <strong>${escapeHtml(input.planName)}</strong> plan.`;

    await this.send({
      to: input.email,
      subject: 'Your LexiRoot family plan seat has ended',
      html: await this.layout({
        heading: 'Your shared plan has ended',
        bodyHtml: `
          <p>Hi ${escapeHtml(input.displayName)},</p>
          <p>${cause}</p>
          <p><strong>Your account is untouched.</strong> Sign in as usual — your languages, streak,
          XP and every lesson you have finished are exactly where you left them. What changes is
          that premium levels are locked again until you are on a plan.</p>
          <p style="font-size:13px;color:${MUTED_COLOR};">You can subscribe from Profile &rsaquo;
          Subscription in the app at any time, or accept a new family invitation. Everything you
          have already learned comes straight back.</p>
        `,
      }),
    });
  }

  async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
    await this.send({
      to: input.email,
      subject: 'Welcome to LexiRoot 🌍',
      html: await this.layout({
        heading: `Welcome, ${escapeHtml(input.displayName.split(' ')[0] ?? '')}!`,
        bodyHtml: `
          <p>Your account is ready. LexiRoot helps you learn African languages and cultures — gamified, audio-first, and built for the whole family.</p>
          <p>Open the app to start your first lesson and begin your streak today.</p>
          <p style="font-size:13px;color:${MUTED_COLOR};">Ẹ kú àbọ̀ — welcome aboard.</p>
        `,
      }),
    });
  }

  async sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
    await this.send({
      to: input.email,
      subject: 'Reset your LexiRoot password',
      devHint: `reset code: ${input.code}`,
      html: await this.layout({
        heading: 'Reset your password',
        bodyHtml: `
          <p>Hi ${escapeHtml(input.displayName)},</p>
          <p>We received a request to reset your password. Enter this 6-digit code in the app to choose a new one:</p>
          ${this.codeBlock(input.code)}
          <p style="font-size:13px;color:${MUTED_COLOR};">This code expires in 1 hour. If you didn't request a reset, you can safely ignore this email — your password won't change.</p>
        `,
      }),
    });
  }

  async sendSubscriptionConfirmationEmail(
    input: SendSubscriptionConfirmationEmailInput,
  ): Promise<void> {
    await this.send({
      to: input.email,
      subject: 'Your LexiRoot Premium is active',
      html: await this.layout({
        heading: 'You’re all set — welcome to Premium',
        bodyHtml: `
          <p>Hi ${escapeHtml(input.displayName)},</p>
          <p>Your <strong>${escapeHtml(input.planName)}</strong> subscription is now active. Enjoy unlimited access to every lesson and feature.</p>
          <p style="font-size:13px;color:${MUTED_COLOR};">Thank you for supporting LexiRoot.</p>
        `,
      }),
    });
  }

  async sendInactivityReengagementEmail(
    input: SendInactivityReengagementEmailInput,
  ): Promise<void> {
    await this.send({
      to: input.email,
      subject: 'Your streak misses you 🔥',
      html: await this.layout({
        heading: 'Pick up where you left off',
        bodyHtml: `
          <p>Hi ${escapeHtml(input.displayName)},</p>
          <p>It's been a little while since your last lesson. A few minutes a day is all it takes to keep your skills — and your streak — alive.</p>
          <p>Jump back in whenever you're ready.</p>
        `,
      }),
    });
  }

  // --- Internals ---

  private async send(opts: {
    to: string;
    subject: string;
    html: string;
    devHint?: string;
  }): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM') ?? 'LexiRoot <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.log(
        `[email] would send "${opts.subject}" to ${opts.to}${
          opts.devHint ? ` — ${opts.devHint}` : ''
        }`,
      );
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Could not send "${opts.subject}" to ${opts.to}: ${body}`);
    }
  }

  /** Wraps body content in the branded header/footer shell (name/tagline from Settings). */
  private async layout(opts: { heading: string; bodyHtml: string }): Promise<string> {
    const year = new Date().getFullYear();
    const settings = await this.platformSettings.getCached();
    const name = escapeHtml(settings.platformName || 'LexiRoot');
    const tagline = escapeHtml(settings.platformTagline || 'Your language. Your roots.');
    return `
      <div style="margin:0;padding:0;background:${PANEL_BG};">
        <div style="max-width:520px;margin:0 auto;padding:24px;">
          <div style="background:${BRAND_COLOR};border-radius:16px 16px 0 0;padding:26px 32px;text-align:center;">
            <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <svg width="26" height="24" viewBox="0 0 97 88" xmlns="http://www.w3.org/2000/svg">
                    <path d="M52.9729 0H76.8582L44.6392 70.6116C43.9056 72.2194 45.0807 74.0472 46.8479 74.0472H87.1762C92.5396 74.0472 96.8874 78.395 96.8874 83.7583V87.4H3.64181C1.54523 87.4 -0.118331 85.6342 0.00661498 83.5413L0.153875 81.0747C0.396309 77.0139 3.76017 73.8449 7.82817 73.8449H10.8923C14.7158 73.8449 18.1834 71.6014 19.7504 68.1139L49.282 2.38794C49.9349 0.934791 51.3798 0 52.9729 0Z" fill="#ffffff"/>
                  </svg>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.4px;">${name}</span>
                </td>
              </tr>
            </table>
          </div>
          <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;font-family:Arial,Helvetica,sans-serif;color:${TEXT_COLOR};line-height:1.6;font-size:15px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:${TEXT_COLOR};">${opts.heading}</h1>
            ${opts.bodyHtml}
          </div>
          <p style="text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED_COLOR};margin-top:16px;">
            © ${year} ${name} · ${tagline}
          </p>
        </div>
      </div>
    `;
  }

  private codeBlock(code: string): string {
    return `
      <p style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;padding:16px 24px;background:${PANEL_BG};color:${TEXT_COLOR};font-size:28px;font-weight:700;letter-spacing:8px;border-radius:12px;font-family:'Menlo','Consolas',monospace;">
          ${escapeHtml(code)}
        </span>
      </p>
    `;
  }

  private button(label: string, url: string): string {
    return `
      <p style="margin:24px 0;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;background:${BRAND_COLOR};color:#ffffff;font-size:16px;font-weight:700;border-radius:12px;text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </p>
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

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmailService } from '../modules/auth/email.service';

interface InactiveRow {
  email: string;
  display_name: string;
}

/**
 * Once a day, email verified learners who have just crossed 7 days of
 * inactivity. The 7–8 day window means each user is caught exactly once as
 * they pass the threshold, so we never spam the same person daily.
 */
@Injectable()
export class InactivityReengagementJob {
  private readonly logger = new Logger(InactivityReengagementJob.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly email: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async run(): Promise<void> {
    const rows: InactiveRow[] = await this.dataSource.query(
      `SELECT "email", "display_name"
         FROM "users"
        WHERE "role" = 'user'
          AND "email_verified_at" IS NOT NULL
          AND "last_active_at" IS NOT NULL
          AND "last_active_at" >= now() - interval '8 days'
          AND "last_active_at" < now() - interval '7 days'`,
    );

    for (const row of rows) {
      await this.email.sendInactivityReengagementEmail({
        email: row.email,
        displayName: row.display_name,
      });
    }

    this.logger.log(`Inactivity re-engagement: sent ${rows.length} email(s)`);
  }
}

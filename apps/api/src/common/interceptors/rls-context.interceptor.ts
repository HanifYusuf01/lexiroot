import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Observable, from, switchMap } from 'rxjs';
import { DataSource } from 'typeorm';

/**
 * Sets the `app.current_user_id` Postgres GUC at the start of each HTTP
 * request, so RLS policies on user-owned tables can scope reads/writes to
 * the authenticated user (see EnableRowLevelSecurity migration).
 *
 * Runs as an interceptor (not Nest middleware) because middleware fires
 * before guards — at that point `req.user` isn't populated yet. Interceptors
 * run after JwtAuthGuard, so the JWT-resolved user is available.
 *
 * `set_config(name, value, false)` is session-scoped (matches CLAUDE.md's
 * spec). The DB connection pool means a prior request's value could leak to
 * a subsequent request on the same physical connection — fine today because
 * the API connects as the table owner and is exempt from RLS, so the policy
 * doesn't actually filter. If/when we switch to a non-owner role (so RLS
 * starts enforcing), this needs to move to per-request `SET LOCAL` inside an
 * explicit transaction, or we need to reset the GUC at request end.
 */
@Injectable()
export class RlsContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RlsContextInterceptor.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
    const userId = req.user?.id;
    if (!userId) return next.handle();

    return from(
      this.dataSource.query(`SELECT set_config('app.current_user_id', $1, false)`, [userId]),
    ).pipe(switchMap(() => next.handle()));
  }
}

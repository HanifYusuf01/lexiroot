import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '../../modules/users/users.service';

/**
 * Bumps `last_active_at` for the authenticated user on each request, throttled
 * per-user so we don't write on every request. Runs after JwtAuthGuard, so it
 * only fires when `request.user` is populated.
 */
@Injectable()
export class LastActiveInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LastActiveInterceptor.name);
  private readonly recentTouches = new Map<string, number>();
  private readonly throttleMs = 60_000;

  constructor(private readonly users: UsersService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
      const userId = req.user?.id;
      if (userId) {
        const now = Date.now();
        const last = this.recentTouches.get(userId) ?? 0;
        if (now - last >= this.throttleMs) {
          this.recentTouches.set(userId, now);
          this.users
            .touchActivity(userId)
            .catch((err) => this.logger.warn(`Failed to bump last_active_at: ${err}`));
        }
      }
    }
    return next.handle();
  }
}

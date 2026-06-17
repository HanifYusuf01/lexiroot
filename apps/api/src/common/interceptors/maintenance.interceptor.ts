import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PlatformSettingsService } from '../../modules/platform-settings/platform-settings.service';
import { User } from '../../modules/users/entities/user.entity';

/**
 * When maintenance mode is on, learner/public traffic gets a 503. Staff
 * (admin/instructor) keep working, and auth + the public settings endpoint stay
 * open so admins can sign in and lift maintenance, and the app can read the
 * downtime message. Runs as an interceptor (after guards) so `req.user` is
 * populated for authenticated routes.
 */
@Injectable()
export class MaintenanceInterceptor implements NestInterceptor {
  constructor(private readonly settings: PlatformSettingsService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') return next.handle();

    const settings = await this.settings.getCached();
    if (!settings.maintenanceMode) return next.handle();

    const req = context.switchToHttp().getRequest<{ user?: User; path?: string; url: string }>();
    const path = req.path ?? req.url ?? '';
    if (path.startsWith('/auth') || path.startsWith('/platform-settings/public')) {
      return next.handle();
    }

    const role = req.user?.role;
    if (role === 'admin' || role === 'instructor') return next.handle();

    throw new ServiceUnavailableException(
      settings.showDowntimeMessage
        ? `${settings.platformName} is temporarily down for maintenance. Please check back soon.`
        : 'Service temporarily unavailable',
    );
  }
}

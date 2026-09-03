import { ForbiddenException, Injectable } from '@nestjs/common';
import { FREE_ACCESS_LEVEL } from '@lexiroot/shared';
import type { UserRole } from '../users/entities/user.entity';
import { EntitlementService } from './entitlement.service';

/** Just enough of a lesson to decide whether it may be read. */
export interface GatedLesson {
  id: string;
  level: number;
}

/** The caller, as far as access is concerned. */
export interface LessonViewer {
  id: string;
  role: UserRole;
}

/**
 * Server-side enforcement of the lesson paywall.
 *
 * The app has always drawn padlocks past `FREE_ACCESS_LEVEL`, but nothing on
 * this side agreed: `/lessons/:id/entries` and `/lessons/:id/exercises` were
 * behind `JwtAuthGuard` alone, so any signed-in free account could read every
 * premium lesson straight from the API. A paywall only the client enforces is
 * decoration.
 *
 * Deliberately narrow. It gates the *content* of a lesson, never the lesson
 * list — the app needs that to draw the locked levels it is inviting people to
 * buy. Entitlement itself is still computed in exactly one place
 * (`EntitlementService`); this only asks it a question.
 */
@Injectable()
export class LessonAccessService {
  constructor(private readonly entitlements: EntitlementService) {}

  async assertCanRead(lesson: GatedLesson, viewer: LessonViewer): Promise<void> {
    // Staff author this material; gating them on a subscription would lock the
    // content team out of their own editor.
    if (viewer.role === 'admin' || viewer.role === 'instructor') return;
    if (lesson.level <= FREE_ACCESS_LEVEL) return;

    const features = await this.entitlements.getFeatures(viewer.id);
    if (features.includes('unlimited_lessons')) return;

    throw new ForbiddenException('This lesson is part of a paid plan.');
  }
}

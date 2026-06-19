import type { LessonCompletionResult } from '@lexiroot/shared';

/**
 * Produces a shape-correct placeholder result for a write that was queued while
 * offline, so the optimistic UI can continue without the real server response.
 * The authoritative values land when `flushOutbox` replays the request on
 * reconnect and the affected RTK Query tags refetch.
 *
 * Note: XP shows as 0 here because it's computed server-side from the lesson's
 * reward. The completion endpoint is idempotent on (user, lesson), so replaying
 * the queued request banks the correct XP exactly once.
 */
export function syntheticOfflineResponse(
  url: string,
  method: string,
  body?: unknown,
): unknown {
  if (method === 'POST' && /\/complete$/.test(url)) {
    const b = (body ?? {}) as { correctCount?: number; totalCount?: number };
    const result: LessonCompletionResult = {
      completion: {
        id: 'offline-pending',
        userId: '',
        lessonId: '',
        xpEarned: 0,
        correctCount: b.correctCount ?? 0,
        totalCount: b.totalCount ?? 0,
        completedAt: new Date().toISOString(),
      },
      xpAwarded: 0,
      streak: 0,
      totalXp: 0,
    };
    return result;
  }

  // lesson-progress PUT is an upsert — echoing the request body is an accurate
  // optimistic representation of the stored row.
  if (method === 'PUT' && /lesson-progress/.test(url)) {
    return body;
  }

  // DELETE (clear progress) and anything else have no meaningful body.
  return undefined;
}

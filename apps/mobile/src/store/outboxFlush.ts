import { createAsyncThunk } from '@reduxjs/toolkit';
import { api, getApiBaseUrl } from '../services/api';
import { selectIsOnline } from './slices/networkSlice';
import { dequeue, setFlushing, type OutboxItem } from './slices/outboxSlice';
import type { RootState } from './index';

async function replay(item: OutboxItem, token: string | null): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${item.url}`, {
    method: item.method,
    headers: {
      'Content-Type': 'application/json',
      // Lets the server dedupe if it ever inspects the key; our writes are also
      // naturally idempotent (completion dedupes on user+lesson, progress is an
      // upsert, clear is a DELETE), so a replay is safe regardless.
      'Idempotency-Key': item.idempotencyKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: item.body !== undefined ? JSON.stringify(item.body) : undefined,
  });
}

/**
 * Drains the outbox in FIFO order. Stops on the first transient failure (5xx or
 * network) so ordering is preserved and the remaining items retry on the next
 * reconnect. Permanent client errors (4xx) and idempotent conflicts (409) are
 * dropped so a single poisoned item can't wedge the queue forever. Refreshes
 * server-derived views once it's done.
 */
export const flushOutbox = createAsyncThunk<void, void, { state: RootState }>(
  'outbox/flush',
  async (_arg, { dispatch, getState }) => {
    const state = getState();
    if (state.outbox.flushing) return;
    if (!selectIsOnline(state)) return;
    if (state.outbox.items.length === 0) return;

    dispatch(setFlushing(true));
    try {
      const token = state.auth.token;
      // Snapshot the queue; new offline writes appended during the flush get
      // picked up on the next run.
      const items = [...getState().outbox.items];
      for (const item of items) {
        let res: Response;
        try {
          res = await replay(item, token);
        } catch {
          break; // network dropped again — keep this and the rest for later
        }
        if (res.ok || res.status === 409) {
          dispatch(dequeue({ id: item.id }));
        } else if (res.status >= 400 && res.status < 500) {
          // Unrecoverable for this payload — drop it rather than block the queue.
          dispatch(dequeue({ id: item.id }));
        } else {
          break; // 5xx — server trouble, retry the whole tail next time
        }
      }
      dispatch(api.util.invalidateTags(['Progress', 'LessonProgress', 'Lesson']));
    } finally {
      dispatch(setFlushing(false));
    }
  },
);

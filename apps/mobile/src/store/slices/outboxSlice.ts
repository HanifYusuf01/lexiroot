import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export interface OutboxItem {
  id: string;
  /** Sent as `Idempotency-Key` so a replay never double-applies server-side. */
  idempotencyKey: string;
  url: string;
  method: string;
  body?: unknown;
  createdAt: string;
}

interface OutboxState {
  items: OutboxItem[];
  /** Guards against concurrent flushes (e.g. reconnect firing twice). */
  flushing: boolean;
}

const initialState: OutboxState = {
  items: [],
  flushing: false,
};

const outboxSlice = createSlice({
  name: 'outbox',
  initialState,
  reducers: {
    enqueue: {
      reducer(state, action: PayloadAction<OutboxItem>) {
        state.items.push(action.payload);
      },
      prepare(input: { url: string; method: string; body?: unknown }) {
        const idempotencyKey = nanoid();
        return {
          payload: {
            id: idempotencyKey,
            idempotencyKey,
            url: input.url,
            method: input.method,
            body: input.body,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
    dequeue(state, action: PayloadAction<{ id: string }>) {
      state.items = state.items.filter((item) => item.id !== action.payload.id);
    },
    setFlushing(state, action: PayloadAction<boolean>) {
      state.flushing = action.payload;
    },
    clearOutbox(state) {
      state.items = [];
      state.flushing = false;
    },
  },
});

export const { enqueue, dequeue, setFlushing, clearOutbox } = outboxSlice.actions;
export default outboxSlice.reducer;

interface OutboxStateSlice {
  outbox: OutboxState;
}

export const selectOutboxCount = (s: OutboxStateSlice): number => s.outbox.items.length;
export const selectOutboxItems = (s: OutboxStateSlice): OutboxItem[] => s.outbox.items;

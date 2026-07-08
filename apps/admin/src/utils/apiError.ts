/**
 * Pull the server's message out of an RTK Query rejection.
 *
 * Nest puts the useful text in `data.message` (a string, or an array of
 * constraint failures from ValidationPipe). Without this, a 409 like "learners
 * are subscribed to it" degrades into a generic "something went wrong".
 */

interface NestErrorBody {
  message?: string | string[];
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!isRecord(err) || !('data' in err)) return fallback;
  const data = (err as { data?: unknown }).data;
  if (!isRecord(data)) return fallback;

  const { message, error } = data as NestErrorBody;
  if (Array.isArray(message)) return message.join('; ');
  if (typeof message === 'string' && message) return message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

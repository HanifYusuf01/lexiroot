/**
 * Turn an RTK Query rejection into a readable one-liner.
 *
 * `unwrap()` rejects with either a `FetchBaseQueryError` (the request reached the
 * server, or the network/parse layer failed) or a `SerializedError` (something
 * threw in our own code). Both hide the server's message a couple of levels
 * down, which is exactly the part worth reading.
 */

interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Nest's ValidationPipe returns `message` as an array of constraint failures. */
function bodyMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const { message, error } = data as NestErrorBody;
  if (Array.isArray(message)) return message.join('; ');
  if (typeof message === 'string') return message;
  if (typeof error === 'string') return error;
  return null;
}

export function describeApiError(err: unknown): string {
  if (!isRecord(err)) return String(err);

  // FetchBaseQueryError: { status, data } — status is a number for HTTP responses,
  // or one of 'FETCH_ERROR' | 'PARSING_ERROR' | 'TIMEOUT_ERROR' | 'CUSTOM_ERROR'.
  if ('status' in err) {
    const { status, data, error } = err as { status: unknown; data?: unknown; error?: unknown };
    const detail = bodyMessage(data) ?? (typeof error === 'string' ? error : null);
    return detail ? `${String(status)}: ${detail}` : String(status);
  }

  // SerializedError from a thrown exception.
  if (typeof err.message === 'string') return err.message;
  return JSON.stringify(err);
}

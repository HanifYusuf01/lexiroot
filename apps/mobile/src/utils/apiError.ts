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

/**
 * The HTTP status of a FetchBaseQueryError, or null for network/parse/serialized
 * errors that never reached the server with a status.
 */
export function apiErrorStatus(err: unknown): number | null {
  if (!isRecord(err)) return null;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

/**
 * The server's own explanation, for showing to a person.
 *
 * `describeApiError` prefixes the HTTP status because it exists for `__DEV__`
 * logging, where knowing it was a 403 rather than a 500 is the point. Putting
 * that in an alert gives the learner a number they can do nothing with in front
 * of the sentence they need — "403: This invitation was sent to a different
 * email address." Falls back to a plain apology when the failure carries no
 * message at all (a network drop, a 502 from the proxy).
 */
export function apiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!isRecord(err)) return fallback;
  if ('status' in err) {
    const { data } = err as { data?: unknown };
    return bodyMessage(data) ?? fallback;
  }
  return typeof err.message === 'string' && err.message ? err.message : fallback;
}

/**
 * Whether a request failed because the content is behind the paywall.
 *
 * The API enforces the lesson paywall as well as the app (see
 * `LessonAccessService`), and the server is the one telling the truth: the
 * app's own `hasUnlimited` comes from a cached auth user that can be stale for
 * up to a refresh — a plan that lapsed mid-session still looks live locally.
 * Treat a 403 on lesson content as the upgrade gate rather than an error.
 */
export function isPaywallError(err: unknown): boolean {
  return apiErrorStatus(err) === 403;
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

import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Thin typed wrapper over the Paystack REST API. Node 20's global `fetch` is used
 * so we take no new dependency. Every Paystack response is `{ status, message,
 * data }`; this unwraps `data` and turns a non-2xx or `status:false` into a
 * throw so callers deal only with the happy path.
 */
const BASE_URL = 'https://api.paystack.co';

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export class PaystackClient {
  constructor(private readonly secretKey: string) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.secretKey}`,
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let envelope: PaystackEnvelope<T> | null = null;
    try {
      envelope = (await res.json()) as PaystackEnvelope<T>;
    } catch {
      // Non-JSON body (e.g. a gateway 5xx) — fall through to the status check.
    }

    if (!res.ok || !envelope?.status) {
      const detail = envelope?.message ?? `HTTP ${res.status}`;
      throw new ServiceUnavailableException(`Paystack ${method} ${path} failed: ${detail}`);
    }
    return envelope.data;
  }
}

/**
 * apiFetch — a thin, typed wrapper around `fetch` for talking to the NestJS backend.
 *
 * Why: every app in this monorepo currently re-implements:
 *   - `if (!response.ok) { showToast('Failed to ...') }` patterns,
 *   - JWT/service-token injection,
 *   - parsing the NestJS `{ message: string | string[] }` error shape,
 *   - exponential backoff for transient 5xx failures.
 *
 * This helper centralises all of that. It is **additive** — existing fetch call sites
 * continue to work; new code should prefer this helper.
 *
 * Usage:
 *   const order = await apiFetch<Order>('/api/v1/orders/123');
 *   await apiFetch('/api/v1/orders/123/status', { method: 'PUT', body: { status: 'PREPARING' } });
 *
 * Errors throw `ApiError` so callers can:
 *   try { await apiFetch(...) }
 *   catch (e) { if (e instanceof ApiError) showToast(e.message); }
 */

const DEFAULT_API_URL = (() => {
  try {
    return (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
  } catch {
    return 'http://localhost:3000';
  }
})();

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Raw body (string/FormData/Blob) OR JSON-serialisable value (object/array). */
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  /** Override the API base URL. Defaults to `VITE_API_URL` (or `http://localhost:3000`). */
  baseUrl?: string;
  /** Skip auto-injecting the bearer token from `localStorage`. Default: false. */
  skipAuth?: boolean;
  /** Number of times to retry a 5xx response. Default: 1. */
  retries?: number;
  /** Per-request timeout in ms. Default: 20000. */
  timeoutMs?: number;
  /**
   * If true, treat a 204 / empty body as success and return undefined.
   * If false (default), the helper just returns undefined for empty bodies.
   */
  expectEmpty?: boolean;
}

function readToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

async function extractErrorMessage(response: Response): Promise<{ message: string; body: unknown }> {
  let text = '';
  try {
    text = await response.text();
  } catch {
    return { message: `${response.status} ${response.statusText || 'Request failed'}`, body: null };
  }
  if (!text) return { message: `${response.status} ${response.statusText || 'Request failed'}`, body: null };
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.message)) return { message: parsed.message.join(', '), body: parsed };
    if (typeof parsed?.message === 'string') return { message: parsed.message, body: parsed };
    if (typeof parsed?.error === 'string') return { message: parsed.error, body: parsed };
    return { message: text, body: parsed };
  } catch {
    return { message: text, body: text };
  }
}

function shouldRetry(status: number): boolean {
  // Retry transient infrastructure failures, but never client errors.
  return status === 502 || status === 503 || status === 504;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const {
    body,
    baseUrl = DEFAULT_API_URL,
    skipAuth = false,
    retries = 1,
    timeoutMs = 20000,
    headers,
    ...rest
  } = opts;

  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const finalHeaders = new Headers(headers || {});

  let init: RequestInit = { ...rest, headers: finalHeaders };

  if (body !== undefined && body !== null) {
    const isRaw =
      typeof body === 'string' ||
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream);
    if (isRaw) {
      init.body = body as BodyInit;
    } else {
      if (!finalHeaders.has('Content-Type')) finalHeaders.set('Content-Type', 'application/json');
      init.body = JSON.stringify(body);
    }
  }

  if (!skipAuth) {
    const token = readToken();
    if (token && !finalHeaders.has('Authorization')) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
    if (controller) init.signal = controller.signal;

    try {
      const response = await fetch(url, init);
      if (timeoutId) clearTimeout(timeoutId);

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        const text = await response.text();
        if (!text) return undefined as T;
        try {
          return JSON.parse(text) as T;
        } catch {
          // Body wasn't JSON. Return it as-is — callers can typecast if needed.
          return text as unknown as T;
        }
      }

      // 401 means the local token is dead. Clear it so the next refresh on the auth store
      // forces a re-login — but don't redirect from here (that's the app's responsibility).
      if (response.status === 401 && !skipAuth) {
        try { localStorage.removeItem('token'); } catch { /* noop */ }
      }

      const { message, body: errBody } = await extractErrorMessage(response);
      if (shouldRetry(response.status) && attempt < retries) {
        await delay(200 * Math.pow(2, attempt));
        attempt++;
        continue;
      }
      throw new ApiError(message, response.status, errBody);
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = err;
      if (err instanceof ApiError) throw err;
      // Network/abort errors get one retry too, then surface.
      if (attempt < retries) {
        await delay(200 * Math.pow(2, attempt));
        attempt++;
        continue;
      }
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const message = isAbort
        ? `Request timed out after ${timeoutMs}ms: ${path}`
        : err instanceof Error
          ? err.message
          : 'Network error';
      throw new ApiError(message, 0, err);
    }
  }
  throw new ApiError('Request failed after retries', 0, lastError);
}

export const apiBaseUrl = DEFAULT_API_URL;

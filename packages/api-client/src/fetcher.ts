/**
 * Единый fetch для сгенерированного orval-клиента.
 * - web (RSC): baseUrl = внутренний адрес API, cookies не нужны;
 * - admin (браузер): baseUrl = '' (тот же origin), cookies + авто-refresh при 401.
 */
export interface ApiConfig {
  baseUrl: string;
  /** Пробовать обновить сессию через /api/auth/refresh при 401 */
  refreshOnUnauthorized: boolean;
  onUnauthorized?: () => void;
}

const config: ApiConfig = { baseUrl: '', refreshOnUnauthorized: false };

export function configureApi(next: Partial<ApiConfig>) {
  Object.assign(config, next);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(extractMessage(body) ?? `HTTP ${status}`);
  }
}

function extractMessage(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.join(', ');
  }
  return undefined;
}

let refreshing: Promise<boolean> | null = null;

/** Параллельные 401 должны вызвать refresh один раз, а не N раз. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${config.baseUrl}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function parse(res: Response) {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${config.baseUrl}${url}`, { credentials: 'include', ...options });

  let res = await doFetch();
  const isAuthCall = url.startsWith('/api/auth/');
  if (res.status === 401 && config.refreshOnUnauthorized && !isAuthCall) {
    if (await refreshSession()) res = await doFetch();
  }

  const body = await parse(res);
  if (!res.ok) {
    if (res.status === 401) config.onUnauthorized?.();
    throw new ApiError(res.status, body);
  }
  return body as T;
}

export default apiFetch;

/**
 * Shared fetch utilities — retry logic, timeout, stale-cache fallback.
 * Used across all API routes for consistent error handling.
 */

export async function fetchWithRetry(
  url: string,
  opts?: RequestInit & { next?: { revalidate?: number } },
  retries = 2,
  timeoutMs = 8000
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        ...opts,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.ok) return res;

      // Rate limited — back off
      if (res.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }

      // Server error — retry
      if (res.status >= 500 && i < retries) {
        await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        continue;
      }

      // Client error or final retry — return as-is
      if (i === retries) return res;
    } catch (e: any) {
      if (i === retries) throw e;
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * In-memory stale cache for API routes.
 * Falls back to last known good response when live fetch fails.
 */
export class StaleCache<T = any> {
  private data: T | null = null;
  private ts = 0;
  private staleTtl: number;

  constructor(staleTtlMs = 600_000) {
    this.staleTtl = staleTtlMs;
  }

  set(data: T) {
    this.data = data;
    this.ts = Date.now();
  }

  get(): (T & { source?: string }) | null {
    if (this.data && Date.now() - this.ts < this.staleTtl) {
      return { ...this.data, source: 'stale-cache' } as any;
    }
    return null;
  }

  has(): boolean {
    return this.data !== null && Date.now() - this.ts < this.staleTtl;
  }
}

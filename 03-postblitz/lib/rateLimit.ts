const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const HOUR_LIMIT = 2;
export const DAY_LIMIT = 6;

type Hit = {
  hourCount: number;
  hourReset: number;
  dayCount: number;
  dayReset: number;
};

const hits = new Map<string, Hit>();

export type RateResult =
  | { ok: true }
  | { ok: false; reason: "hour" | "day"; retryAfter: number };

export function checkRateLimit(ip: string): RateResult {
  const now = Date.now();
  const existing = hits.get(ip);
  const h: Hit = existing ?? {
    hourCount: 0,
    hourReset: 0,
    dayCount: 0,
    dayReset: 0,
  };

  if (now >= h.hourReset) {
    h.hourCount = 0;
    h.hourReset = now + HOUR_MS;
  }
  if (now >= h.dayReset) {
    h.dayCount = 0;
    h.dayReset = now + DAY_MS;
  }

  if (h.dayCount >= DAY_LIMIT) {
    hits.set(ip, h);
    return {
      ok: false,
      reason: "day",
      retryAfter: Math.ceil((h.dayReset - now) / 1000),
    };
  }
  if (h.hourCount >= HOUR_LIMIT) {
    hits.set(ip, h);
    return {
      ok: false,
      reason: "hour",
      retryAfter: Math.ceil((h.hourReset - now) / 1000),
    };
  }

  h.hourCount += 1;
  h.dayCount += 1;
  hits.set(ip, h);
  return { ok: true };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

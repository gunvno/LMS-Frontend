export function parseApiDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }

  if (Array.isArray(value) && value.length >= 3) {
    const parts = value.map(Number);
    if (parts.slice(0, 3).every(Number.isFinite)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = parts;
      const date = new Date(year, month - 1, day, hour, minute, second);
      return Number.isFinite(date.getTime()) ? date : null;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    const year = Number(item.year);
    const month = Number(item.monthValue ?? item.month);
    const day = Number(item.dayOfMonth ?? item.day);
    if ([year, month, day].every(Number.isFinite)) {
      const date = new Date(
        year,
        month - 1,
        day,
        Number(item.hour ?? 0),
        Number(item.minute ?? 0),
        Number(item.second ?? 0)
      );
      return Number.isFinite(date.getTime()) ? date : null;
    }
    return null;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  const numericTimestamp = /^\d{10,13}$/.test(raw) ? Number(raw) : Number.NaN;
  const normalized = raw.replace(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/,
    "$1T$2"
  );
  const date = new Date(Number.isFinite(numericTimestamp) ? numericTimestamp : normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatViDateTime(value: unknown): string | null {
  const date = parseApiDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDurationMinutes(startedAt: unknown, submittedAt: unknown): string | null {
  const started = parseApiDate(startedAt);
  const submitted = parseApiDate(submittedAt);
  if (!started || !submitted) return null;
  const duration = submitted.getTime() - started.getTime();
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return `${Math.max(1, Math.round(duration / 60_000))} phút`;
}

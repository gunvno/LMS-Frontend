function dateFromArray(value: unknown[]) {
  if (value.length < 3) return null;
  const parts = value.map((part) => Number(part));
  if (parts.slice(0, 3).some((part) => !Number.isFinite(part))) return null;

  const [year, month, day, hour = 0, minute = 0, second = 0, fraction = 0] = parts;
  const milliseconds = fraction > 999 ? Math.floor(fraction / 1_000_000) : fraction;
  const date = new Date(year, month - 1, day, hour, minute, second, milliseconds);
  return Number.isFinite(date.getTime()) ? date : null;
}

function dateFromObject(value: Record<string, unknown>) {
  const year = Number(value.year);
  const month = Number(value.monthValue ?? value.month);
  const day = Number(value.dayOfMonth ?? value.day);
  if (![year, month, day].every(Number.isFinite)) return null;

  const nano = Number(value.nano ?? 0);
  const date = new Date(
    year,
    month - 1,
    day,
    Number(value.hour ?? 0),
    Number(value.minute ?? 0),
    Number(value.second ?? 0),
    nano > 999 ? Math.floor(nano / 1_000_000) : nano,
  );
  return Number.isFinite(date.getTime()) ? date : null;
}

export function parseApiDate(value: unknown, fallbackEpoch?: unknown) {
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (Array.isArray(value)) {
    date = dateFromArray(value);
  } else if (typeof value === "number") {
    date = new Date(value);
  } else if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().replace(" ", "T");
    const parsed = new Date(normalized);
    if (Number.isFinite(parsed.getTime())) date = parsed;
  } else if (value && typeof value === "object") {
    date = dateFromObject(value as Record<string, unknown>);
  }

  if (date && Number.isFinite(date.getTime())) return date;

  const epoch = Number(fallbackEpoch);
  if (Number.isFinite(epoch) && String(Math.trunc(epoch)).length === 13) {
    const fallbackDate = new Date(epoch);
    if (Number.isFinite(fallbackDate.getTime())) return fallbackDate;
  }
  return null;
}

export function formatApiDate(value: unknown, fallbackEpoch?: unknown) {
  const date = parseApiDate(value, fallbackEpoch);
  if (!date) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function normalizeChatDateTime(value: unknown): string {
  if (typeof value === "string") {
    const normalized = value
      .trim()
      .replace(" ", "T")
      .replace(/(\.\d{3})\d+/, "$1");
    if (!normalized) return "";
    return Number.isFinite(new Date(normalized).getTime()) ? normalized : "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = Math.abs(value) < 1_000_000_000_000 ? value * 1_000 : value;
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date.toISOString() : "";
  }

  if (Array.isArray(value) && value.length >= 3) {
    const parts = value.map(Number);
    if (parts.every(Number.isFinite)) {
      const [year, month, day, hour = 0, minute = 0, second = 0, nanosecond = 0] = parts;
      const milliseconds = Math.trunc(nanosecond / 1_000_000);
      const date = new Date(year, month - 1, day, hour, minute, second, milliseconds);
      if (
        Number.isFinite(date.getTime())
        && date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day
        && date.getHours() === hour
        && date.getMinutes() === minute
        && date.getSeconds() === second
      ) {
        const pad = (part: number, length = 2) => String(Math.trunc(part)).padStart(length, "0");
        return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(milliseconds, 3)}`;
      }
    }
  }

  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    const year = Number(item.year);
    const month = Number(item.monthValue ?? item.month);
    const day = Number(item.dayOfMonth ?? item.day);
    if ([year, month, day].every(Number.isFinite)) {
      return normalizeChatDateTime([
        year,
        month,
        day,
        Number(item.hour ?? 0),
        Number(item.minute ?? 0),
        Number(item.second ?? 0),
        Number(item.nano ?? 0),
      ]);
    }
  }

  return "";
}

type DatedMessage = {
  id: string;
  createdAt?: unknown;
};

function normalizeMessage<T extends DatedMessage>(message: T): T {
  return {
    ...message,
    createdAt: normalizeChatDateTime(message.createdAt),
  } as T;
}

function timestamp(value: unknown): number | null {
  const normalized = normalizeChatDateTime(value);
  if (!normalized) return null;
  const result = new Date(normalized).getTime();
  return Number.isFinite(result) ? result : null;
}

export function mergeChronologicalMessage<T extends DatedMessage>(
  messages: readonly T[],
  incoming: T,
): T[] {
  const existing = messages.find((message) => message.id === incoming.id);
  const incomingCreatedAt = normalizeChatDateTime(incoming.createdAt);
  const normalizedIncoming = {
    ...incoming,
    createdAt: incomingCreatedAt || normalizeChatDateTime(existing?.createdAt),
  } as T;

  const next = messages.some((message) => message.id === incoming.id)
    ? messages.map((message) => message.id === incoming.id ? normalizedIncoming : normalizeMessage(message))
    : [...messages.map(normalizeMessage), normalizedIncoming];

  return next
    .map((message, index) => ({ message, index, timestamp: timestamp(message.createdAt) }))
    .sort((left, right) => {
      if (left.timestamp === null && right.timestamp === null) return left.index - right.index;
      if (left.timestamp === null) return 1;
      if (right.timestamp === null) return -1;
      return left.timestamp - right.timestamp || left.index - right.index;
    })
    .map(({ message }) => message);
}

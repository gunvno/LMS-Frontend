import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeChronologicalMessage,
  normalizeChatDateTime,
} from "../src/lib/chat-date-time.ts";

const message = (id, createdAt, content = id) => ({
  id,
  conversationId: "conversation-1",
  senderId: "student-1",
  content,
  createdAt,
});

test("normalizes Java LocalDateTime arrays and rejects missing dates", () => {
  assert.equal(
    normalizeChatDateTime([2026, 7, 15, 15, 18, 45, 123_000_000]),
    "2026-07-15T15:18:45.123",
  );
  assert.equal(normalizeChatDateTime(null), "");
  assert.equal(normalizeChatDateTime(undefined), "");
});

test("places a live Java-time message chronologically instead of at the top", () => {
  const messages = [
    message("first", "2026-07-15T15:17:00.000"),
    message("second", "2026-07-15T15:18:00.000"),
  ];

  const merged = mergeChronologicalMessage(
    messages,
    message("new", [2026, 7, 15, 15, 19, 0, 250_000_000]),
  );

  assert.deepEqual(merged.map(({ id }) => id), ["first", "second", "new"]);
  assert.equal(merged[2].createdAt, "2026-07-15T15:19:00.250");
});

test("keeps invalid newly received dates at the end in stable arrival order", () => {
  const firstInvalid = mergeChronologicalMessage(
    [message("valid", "2026-07-15T15:18:00.000")],
    message("invalid-1", null),
  );
  const secondInvalid = mergeChronologicalMessage(firstInvalid, message("invalid-2", null));

  assert.deepEqual(secondInvalid.map(({ id }) => id), ["valid", "invalid-1", "invalid-2"]);
});

test("deduplicates POST and WebSocket copies without losing a valid timestamp", () => {
  const initial = [message("old", "2026-07-15T15:17:00.000")];
  const postResult = mergeChronologicalMessage(
    initial,
    message("same-id", "2026-07-15T15:18:00.125", "POST"),
  );
  const websocketResult = mergeChronologicalMessage(
    postResult,
    message("same-id", [2026, 7, 15, 15, 18, 0, 125_000_000], "WebSocket"),
  );
  const missingDateDuplicate = mergeChronologicalMessage(
    websocketResult,
    message("same-id", null, "WebSocket retry"),
  );

  assert.deepEqual(missingDateDuplicate.map(({ id }) => id), ["old", "same-id"]);
  assert.equal(missingDateDuplicate[1].content, "WebSocket retry");
  assert.equal(missingDateDuplicate[1].createdAt, "2026-07-15T15:18:00.125");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDurationMinutes,
  formatViDateTime,
  parseApiDate,
} from "../src/lib/date-time.ts";

test("formats every LocalDateTime representation returned by the API", () => {
  const values = [
    "2026-07-15T09:30:00",
    "2026-07-15 09:30:00",
    [2026, 7, 15, 9, 30, 0],
    { year: 2026, monthValue: 7, dayOfMonth: 15, hour: 9, minute: 30 },
    1_721_010_600_000,
  ];

  for (const value of values) {
    assert.ok(parseApiDate(value));
    assert.ok(formatViDateTime(value));
  }
});

test("rejects missing or invalid dates instead of throwing RangeError", () => {
  const values = [null, undefined, "", "not-a-date", []];

  for (const value of values) {
    assert.equal(parseApiDate(value), null);
    assert.equal(formatViDateTime(value), null);
  }
});

test("calculates attempt duration for array-based API dates", () => {
  assert.equal(
    formatDurationMinutes([2026, 7, 15, 9, 0], [2026, 7, 15, 9, 12]),
    "12 phút"
  );
});

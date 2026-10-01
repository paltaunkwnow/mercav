import { test } from "node:test";
import assert from "node:assert/strict";
import { FORUM_SYNC_INTERVAL_MS, FORUM_SYNC_LOCK_MS, forumSyncSkipReason } from "../forum-sync-policy";

test("forum sync runs when nothing has been stored yet", () => {
  assert.equal(forumSyncSkipReason({ lastSuccessAt: null, runningSince: null }), null);
});

test("forum sync stays quiet for 10 minutes after a success", () => {
  const now = Date.parse("2026-09-30T15:00:00.000Z");
  assert.equal(
    forumSyncSkipReason({
      now,
      lastSuccessAt: new Date(now - FORUM_SYNC_INTERVAL_MS + 1_000),
      runningSince: null,
    }),
    "fresh",
  );
  assert.equal(
    forumSyncSkipReason({
      now,
      lastSuccessAt: new Date(now - FORUM_SYNC_INTERVAL_MS - 1_000),
      runningSince: null,
    }),
    null,
  );
});

test("forum sync does not start a second job while one is in flight", () => {
  const now = Date.parse("2026-09-30T15:00:00.000Z");
  assert.equal(
    forumSyncSkipReason({
      now,
      lastSuccessAt: null,
      runningSince: new Date(now - 20_000),
    }),
    "in_flight",
  );
});

test("a stuck running job older than the lock no longer blocks", () => {
  const now = Date.parse("2026-09-30T15:00:00.000Z");
  assert.equal(
    forumSyncSkipReason({
      now,
      lastSuccessAt: null,
      runningSince: new Date(now - FORUM_SYNC_LOCK_MS - 1_000),
    }),
    null,
  );
});

test("force bypasses freshness and the in-flight lock", () => {
  const now = Date.parse("2026-09-30T15:00:00.000Z");
  assert.equal(
    forumSyncSkipReason({
      now,
      force: true,
      lastSuccessAt: new Date(now),
      runningSince: new Date(now),
    }),
    null,
  );
});
// creado por pato dev y askforvini

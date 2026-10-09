import { test } from "node:test";
import assert from "node:assert/strict";
import { apiRouteGroup, evictHitBuckets, pwnCsrfBlockReason, type HitBucket, type PwnCsrfInput } from "../request-guard";
import { exposureView } from "../exposure-visibility";
import { hashMailboxToken, issueMailboxToken, mailboxTokenUsable } from "../mailbox-token";
import { canAutoVerifyEmail, confirmationMethodFor } from "../monitor-authorization";
import { mayForceForumSync } from "../forum-sync-policy";
import { retryAfterCopy, secondsUntilToken } from "../rate-copy";
import { anyTxtRecordMatches, generateVerificationToken } from "../../../app/api/pwn/_lib/verification";

test("rate-limit groups ignore caller-controlled path segments", () => {
  assert.equal(apiRouteGroup("/api/users/ana"), "/api/users");
  assert.equal(apiRouteGroup("/api/users/beto/posts"), "/api/users");
  assert.equal(apiRouteGroup("/api/pwn/exposure"), "/api/pwn/exposure");
  assert.equal(apiRouteGroup("/api/pwn/whatever-123"), "/api/pwn/other");
  assert.equal(apiRouteGroup("/api/pwn/monitoring/verify"), "/api/pwn/monitoring");
  assert.equal(apiRouteGroup("/api/auth/session"), "/api/auth/session");
  assert.equal(apiRouteGroup("/api/auth/callback/credentials"), "/api/auth/callback");
  assert.equal(apiRouteGroup("/api/auth/random-x"), "/api/auth/other");
  assert.equal(apiRouteGroup("/api/%2e%2e"), "/api/other");
});

test("eviction drops expired buckets first and never wipes active callers", () => {
  const map = new Map<string, HitBucket>();
  const now = 1_000_000;
  map.set("old-expired", { count: 5, resetAt: now - 1 });
  for (let i = 0; i < 9; i += 1) map.set(`live-${i}`, { count: 1, resetAt: now + 30_000 });
  evictHitBuckets(map, now, 10);
  assert.equal(map.has("old-expired"), false);
  assert.equal(map.size, 9);

  const full = new Map<string, HitBucket>();
  for (let i = 0; i < 10; i += 1) full.set(`live-${i}`, { count: 1, resetAt: now + 30_000 });
  evictHitBuckets(full, now, 10);
  assert.equal(full.size, 9);
  assert.equal(full.has("live-0"), false, "the oldest live bucket goes first");
  assert.equal(full.has("live-9"), true);
});

function csrf(overrides: Partial<PwnCsrfInput>): string | null {
  return pwnCsrfBlockReason({
    method: "POST",
    pathname: "/api/pwn/monitoring",
    secFetchSite: "same-origin",
    contentType: "application/json",
    contentLength: "42",
    transferEncoding: null,
    authorization: null,
    ...overrides,
  });
}

test("pwn writes must be same-origin JSON", () => {
  assert.equal(csrf({}), null);
  assert.equal(csrf({ contentType: "application/json; charset=utf-8" }), null);
  assert.equal(csrf({ secFetchSite: "cross-site" }), "cross-site");
  assert.equal(csrf({ secFetchSite: "same-site" }), "cross-site");
  assert.equal(csrf({ contentType: "application/x-www-form-urlencoded" }), "content-type");
  assert.equal(csrf({ contentType: "text/plain" }), "content-type");
  assert.equal(csrf({ contentType: null }), "content-type", "a body without a type is rejected");
  assert.equal(csrf({ secFetchSite: null }), null, "server-to-server calls without the header still work");
});

test("pwn writes from a Mercav domain to api.mercav.lat pass, other same-site origins don't", () => {
  assert.equal(csrf({ secFetchSite: "same-site", origin: "https://www.mercav.lat" }), null);
  assert.equal(csrf({ secFetchSite: "same-site", origin: "https://app.mercav.lat" }), null);
  assert.equal(csrf({ secFetchSite: "same-site", origin: "https://kosher.mercav.lat" }), null);
  assert.equal(csrf({ secFetchSite: "same-site", origin: "https://evil.mercav.lat" }), "cross-site");
  assert.equal(csrf({ secFetchSite: "same-site", origin: "https://www.mercav.lat.attacker.io" }), "cross-site");
  assert.equal(csrf({ secFetchSite: "same-site", origin: null }), "cross-site");
  assert.equal(csrf({ secFetchSite: "cross-site", origin: "https://www.mercav.lat" }), "cross-site", "only same-site is trusted");
});

test("pwn CSRF guard leaves reads, bodiless patrol, cron and other APIs alone", () => {
  assert.equal(csrf({ method: "GET", secFetchSite: "cross-site", contentType: null }), null);
  assert.equal(csrf({ pathname: "/api/pwn/forum-signals", contentType: null, contentLength: null }), null);
  assert.equal(
    csrf({ pathname: "/api/pwn/internal/cycle", secFetchSite: "none", contentType: null, contentLength: null, authorization: "Bearer s3cret" }),
    null,
  );
  assert.equal(csrf({ pathname: "/api/pwn/internal/cycle", secFetchSite: "none", authorization: null }), "cross-site");
  assert.equal(csrf({ pathname: "/api/pwn/passwords/range" }), null);
  assert.equal(csrf({ pathname: "/api/contact", secFetchSite: "cross-site", contentType: "text/plain" }), null);
});

const breaches = [
  { name: "A", isFabricated: false, isSensitive: false },
  { name: "Adult", isFabricated: false, isSensitive: true },
  { name: "Fake", isFabricated: true, isSensitive: false },
];

test("strangers only get yes/no and a non-sensitive count", () => {
  const view = exposureView(breaches, "summary");
  assert.equal(view.scope, "summary");
  assert.equal(view.items.length, 0);
  assert.equal(view.count, 1);
  assert.equal(view.exposed, true);
  assert.equal(view.hiddenSensitive, 0, "never reveal that a sensitive breach exists");
  const onlySensitive = exposureView([{ isFabricated: false, isSensitive: true }], "summary");
  assert.equal(onlySensitive.exposed, false);
});

test("the verified owner sees everything; the public catalog never shows sensitive rows", () => {
  const owner = exposureView(breaches, "owner");
  assert.equal(owner.scope, "full");
  assert.equal(owner.items.length, 3);
  const catalog = exposureView(breaches, "catalog");
  assert.deepEqual(catalog.items.map((item) => item.name), ["A", "Fake"]);
  assert.equal(catalog.hiddenSensitive, 1);
});

test("mailbox tokens expire and only match their own hash", () => {
  const now = Date.parse("2026-10-09T12:00:00.000Z");
  const issued = issueMailboxToken(now, 60_000);
  assert.equal(mailboxTokenUsable(issued.token, now), true);
  assert.equal(mailboxTokenUsable(issued.token, now + 61_000), false);
  assert.equal(hashMailboxToken(issued.token), issued.tokenHash);
  const [expiry, rest] = issued.token.split(".");
  const tampered = `${(parseInt(expiry, 36) + 999_999).toString(36)}.${rest}`;
  assert.notEqual(hashMailboxToken(tampered), issued.tokenHash, "extending the expiry breaks the hash");
  assert.equal(mailboxTokenUsable("not-a-token"), false);
});

test("only a confirmed account email verifies itself", () => {
  assert.equal(canAutoVerifyEmail({ isAccountEmail: true, accountConfirmed: true }), true);
  assert.equal(canAutoVerifyEmail({ isAccountEmail: true, accountConfirmed: false }), false);
  assert.equal(canAutoVerifyEmail({ isAccountEmail: false, accountConfirmed: true }), false);
  const base = { isAccountEmail: true, accountConfirmed: false, mailerReady: true };
  assert.equal(confirmationMethodFor({ targetType: "EMAIL", ...base }), "EMAIL_LINK");
  assert.equal(confirmationMethodFor({ targetType: "EMAIL", ...base, mailerReady: false }), "ADMIN_AUTHORIZATION");
  assert.equal(confirmationMethodFor({ targetType: "EMAIL", ...base, accountConfirmed: true }), "ACCOUNT");
  assert.equal(confirmationMethodFor({ targetType: "DOMAIN", ...base, accountConfirmed: true }), "DNS_TXT");
});

test("DNS TXT verification needs the exact record, split chunks included", () => {
  const { token, tokenHash } = generateVerificationToken();
  const record = `mercav-pwn=${token}`;
  assert.equal(anyTxtRecordMatches([["v=spf1 -all"], [record]], tokenHash), true);
  assert.equal(anyTxtRecordMatches([[record.slice(0, 20), record.slice(20)]], tokenHash), true);
  assert.equal(anyTxtRecordMatches([["mercav-pwn=otro"]], tokenHash), false);
  assert.equal(anyTxtRecordMatches([], tokenHash), false);
});

test("forcing a forum sync is reserved to admins and the cron", () => {
  assert.equal(mayForceForumSync({ requested: true, isAdmin: false, cronAuthorized: false }), false);
  assert.equal(mayForceForumSync({ requested: true, isAdmin: true, cronAuthorized: false }), true);
  assert.equal(mayForceForumSync({ requested: true, isAdmin: false, cronAuthorized: true }), true);
  assert.equal(mayForceForumSync({ requested: false, isAdmin: true, cronAuthorized: true }), false);
});

test("rate-limit copy tells when to retry", () => {
  assert.equal(retryAfterCopy(40), "Probá de nuevo en 40 s.");
  assert.equal(retryAfterCopy(61), "Probá de nuevo en 2 min.");
  assert.equal(retryAfterCopy(3 * 3600), "Probá de nuevo en 3 h.");
  assert.equal(secondsUntilToken(0, 10), 6);
  assert.equal(secondsUntilToken(0, 50 / 1440), 1728);
});
// creado por pato dev y askforvini

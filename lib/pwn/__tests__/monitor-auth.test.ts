import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MONITOR_AUTH_MESSAGE_MAX,
  adminRequestCopy,
  canDecideMonitorAuthorization,
  canRequestMonitorAuthorization,
  decisionBlockedReason,
  monitorAuthBadge,
  monitorAuthHint,
  needsAdminAuthorization,
  ownerDecisionCopy,
  pendingConsultationCopy,
  requestBlockedReason,
  sanitizeAuthorizationMessage,
} from "../monitor-authorization";

test("only other emails need an administrator", () => {
  assert.equal(needsAdminAuthorization("EMAIL", true), false);
  assert.equal(needsAdminAuthorization("EMAIL", false), true);
  assert.equal(needsAdminAuthorization("DOMAIN", false), false);
  assert.equal(needsAdminAuthorization("DOMAIN", true), false);
  assert.equal(requestBlockedReason("PENDING", "DOMAIN"), "Los dominios se verifican con un registro DNS TXT, no con un administrador.");
  assert.match(monitorAuthHint("PENDING", "DOMAIN") ?? "", /TXT/);
  assert.equal(monitorAuthHint("VERIFIED", "DOMAIN"), null);
  assert.match(monitorAuthHint("PENDING", "EMAIL") ?? "", /consultar/);
});

test("a second request is blocked while the admin has not decided", () => {
  assert.equal(canRequestMonitorAuthorization("PENDING"), true);
  assert.equal(canRequestMonitorAuthorization("DENIED"), true);
  assert.equal(canRequestMonitorAuthorization("REQUESTED"), false);
  assert.equal(requestBlockedReason("REQUESTED"), "Ya hay una solicitud pendiente de un administrador.");
  assert.equal(requestBlockedReason("VERIFIED"), "Este objetivo ya está autorizado.");
  assert.equal(monitorAuthBadge("REQUESTED").tone, "waiting");
});

test("the admin can only decide a requested target", () => {
  assert.equal(canDecideMonitorAuthorization("REQUESTED"), true);
  assert.equal(canDecideMonitorAuthorization("PENDING"), false);
  assert.equal(decisionBlockedReason("PENDING"), "No hay una solicitud pendiente para este objetivo.");
  assert.equal(decisionBlockedReason("REQUESTED"), null);
});

test("authorization notes are trimmed and capped", () => {
  assert.equal(sanitizeAuthorizationMessage("   "), null);
  assert.equal(sanitizeAuthorizationMessage("  Revisar cuenta VIP  "), "Revisar cuenta VIP");
  assert.equal(sanitizeAuthorizationMessage("x".repeat(MONITOR_AUTH_MESSAGE_MAX + 40))?.length, MONITOR_AUTH_MESSAGE_MAX);
});

test("notifications name the requester and the decision", () => {
  const request = adminRequestCopy("Ana Pérez", "v***@g***", "correo");
  assert.equal(request.title, "Solicitud de patrullaje Pwn");
  assert.match(request.body, /Ana Pérez/);
  const approved = ownerDecisionCopy(true, "v***@g***");
  assert.equal(approved.title, "Patrullaje autorizado");
  const pending = pendingConsultationCopy("v***@g***");
  assert.match(pending.body, /consultar/);
});
// creado por pato dev y askforvini

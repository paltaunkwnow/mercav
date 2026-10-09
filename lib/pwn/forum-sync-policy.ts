export const FORUM_SYNC_INTERVAL_MS = 10 * 60 * 1000;
export const FORUM_SYNC_LOCK_MS = 3 * 60 * 1000;

export type ForumSyncSkipReason = "fresh" | "in_flight";

export function forumSyncSkipReason(input: {
  now?: number;
  lastSuccessAt: Date | string | null;
  runningSince: Date | string | null;
  force?: boolean;
}): ForumSyncSkipReason | null {
  if (input.force) return null;
  const now = input.now ?? Date.now();
  const running = toTime(input.runningSince);
  if (running !== null && now - running < FORUM_SYNC_LOCK_MS) return "in_flight";
  const last = toTime(input.lastSuccessAt);
  if (last !== null && now - last < FORUM_SYNC_INTERVAL_MS) return "fresh";
  return null;
}

/** Saltear la ventana de 10 min es caro (scrape completo): solo administradores o el cron con CRON_SECRET. */
export function mayForceForumSync(input: { requested: boolean; isAdmin: boolean; cronAuthorized: boolean }): boolean {
  return input.requested && (input.isAdmin || input.cronAuthorized);
}

function toTime(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time : null;
}
// creado por pato dev y askforvini

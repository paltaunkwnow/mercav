/** Only the owner may create, pause or delete their monitoring targets. */
export function canManageMonitoring(sessionUserId: string | null, targetUserId: string): boolean {
  if (!sessionUserId || !targetUserId) return false;
  return sessionUserId === targetUserId;
}

/** `roles` are Mercav RoleType values (UserRole.role). */
export function isAdmin(roles: string[] | undefined): boolean {
  return Array.isArray(roles) && roles.includes("ADMIN");
}

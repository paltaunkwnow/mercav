"use client";

import { useEffect } from "react";

/** Keeps the account dashboard focused on the company the user last opened. */
export function BusinessLastVisited({ workspaceId }: { workspaceId: string }) {
  useEffect(() => {
    fetch("/api/business/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastWorkspaceId: workspaceId }),
    }).catch(() => {});
  }, [workspaceId]);
  return null;
}

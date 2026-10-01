"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function FollowButton({ userId, username, initialFollowed = false }: { userId: string, username?: string, initialFollowed?: boolean }) {
  const [isFollowing, setIsFollowing] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (loading || !username) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/follow/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.data.followed);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={loading}
      aria-pressed={isFollowing}
      className={`mv-btn mv-btn-sm ${isFollowing ? "mv-btn-secondary" : "mv-btn-primary"}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {isFollowing ? "Siguiendo" : "Seguir"}
    </button>
  );
}
// creado por pato dev y askforvini

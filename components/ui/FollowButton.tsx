"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    <Button
      variant={isFollowing ? "default" : "outline"}
      onClick={handleFollow}
      disabled={loading}
      className={`h-11 px-6 rounded-xl ${isFollowing ? 'bg-bg-tertiary text-white border-border hover:bg-bg-secondary' : 'border-border text-white hover:border-gold hover:text-gold bg-bg-tertiary'}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {isFollowing ? "Siguiendo" : "Seguir"}
    </Button>
  );
}

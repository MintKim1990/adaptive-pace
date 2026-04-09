"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon, getPlatformName } from "@/components/social/platform-icons";
import { toast } from "sonner";
import type { PublicationWithPost } from "@/types/social";

interface QueueItemProps {
  publication: PublicationWithPost;
  onAction: () => void;
}

export function QueueItem({ publication, onAction }: QueueItemProps) {
  const [loading, setLoading] = useState(false);

  const post = publication.posts;
  const contentPreview = post.content.length > 120 ? post.content.slice(0, 120) + "..." : post.content;

  async function handlePublishNow() {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
      if (res.ok) {
        toast.success("Published!");
        onAction();
      } else {
        const data = await res.json();
        toast.error(data.error || "Publish failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted");
        onAction();
      }
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500",
    publishing: "bg-yellow-500",
    published: "bg-green-500",
    failed: "bg-red-500",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={publication.platform} className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">{getPlatformName(publication.platform)}</span>
            <Badge className={`${statusColors[publication.status]} text-white text-xs`}>
              {publication.status}
            </Badge>
            {publication.scheduled_at && publication.status === "scheduled" && (
              <span className="text-xs text-muted-foreground">
                {new Date(publication.scheduled_at).toLocaleString()}
              </span>
            )}
            {publication.published_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(publication.published_at).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm">{contentPreview}</p>
          {publication.error_message && (
            <p className="text-xs text-red-500">{publication.error_message}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {(publication.status === "scheduled" || publication.status === "failed") && (
            <Button variant="outline" size="sm" onClick={handlePublishNow} disabled={loading}>
              {loading ? "..." : "Publish Now"}
            </Button>
          )}
          {(publication.status === "scheduled") && (
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

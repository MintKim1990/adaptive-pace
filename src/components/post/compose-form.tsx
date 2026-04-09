"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PlatformIcon, getPlatformName } from "@/components/social/platform-icons";
import { toast } from "sonner";
import type { SocialPlatform, SocialAccountPublic } from "@/types/social";
import { PLATFORM_CHAR_LIMITS } from "@/types/social";

interface ComposeFormProps {
  connectedAccounts: SocialAccountPublic[];
  onPublished: () => void;
}

export function ComposeForm({ connectedAccounts, onPublished }: ComposeFormProps) {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  const connectedPlatforms = connectedAccounts.map((a) => a.platform);

  function togglePlatform(platform: SocialPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  function getCharColor(count: number, limit: number) {
    if (count > limit) return "text-red-500";
    if (count > limit * 0.9) return "text-yellow-500";
    return "text-muted-foreground";
  }

  async function handleSubmit() {
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform.");
      return;
    }

    // Check character limits
    for (const platform of selectedPlatforms) {
      if (content.length > PLATFORM_CHAR_LIMITS[platform]) {
        toast.error(`Content exceeds ${getPlatformName(platform)}'s ${PLATFORM_CHAR_LIMITS[platform]} character limit.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          platforms: selectedPlatforms,
          scheduled_at: scheduleMode === "schedule" ? new Date(scheduledAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create post");
        return;
      }

      toast.success(scheduleMode === "now" ? "Published!" : "Scheduled!");
      setContent("");
      setSelectedPlatforms([]);
      setScheduledAt("");
      onPublished();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            placeholder="Write your post..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="mt-1 flex gap-3 text-xs">
            {selectedPlatforms.map((platform) => (
              <span key={platform} className={getCharColor(content.length, PLATFORM_CHAR_LIMITS[platform])}>
                {getPlatformName(platform)}: {content.length}/{PLATFORM_CHAR_LIMITS[platform]}
              </span>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Platforms</Label>
          <div className="flex gap-3">
            {connectedPlatforms.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  selectedPlatforms.includes(platform)
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input text-muted-foreground hover:text-foreground"
                }`}
              >
                <PlatformIcon platform={platform} className="h-4 w-4" />
                {getPlatformName(platform)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Schedule</Label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="schedule"
                checked={scheduleMode === "now"}
                onChange={() => setScheduleMode("now")}
              />
              Publish Now
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="schedule"
                checked={scheduleMode === "schedule"}
                onChange={() => setScheduleMode("schedule")}
              />
              Schedule
            </label>
            {scheduleMode === "schedule" && (
              <input
                type="datetime-local"
                className="rounded-lg border border-input bg-transparent px-2 py-1 text-sm"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !content.trim() ||
              selectedPlatforms.length === 0 ||
              selectedPlatforms.some((p) => content.length > PLATFORM_CHAR_LIMITS[p])
            }
          >
            {loading ? "Processing..." : scheduleMode === "now" ? "Publish Now" : "Schedule Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

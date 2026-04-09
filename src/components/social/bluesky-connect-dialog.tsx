"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BlueskyConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export function BlueskyConnectDialog({ open, onOpenChange, onConnected }: BlueskyConnectDialogProps) {
  const [handle, setHandle] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/social/bluesky/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), appPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Connection failed");
        return;
      }

      setHandle("");
      setAppPassword("");
      onOpenChange(false);
      onConnected();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Bluesky</DialogTitle>
          <DialogDescription>
            Enter your Bluesky handle and an{" "}
            <a
              href="https://bsky.app/settings/app-passwords"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary"
            >
              app password
            </a>
            . Your main password is never used.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              placeholder="user.bsky.social"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appPassword">App Password</Label>
            <Input
              id="appPassword"
              type="password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connecting..." : "Connect"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

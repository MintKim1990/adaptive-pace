"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SocialAccountCard } from "@/components/social/social-account-card";
import { BlueskyConnectDialog } from "@/components/social/bluesky-connect-dialog";
import { toast } from "sonner";
import type { SocialAccountPublic, SocialPlatform } from "@/types/social";

const PLATFORMS: SocialPlatform[] = ["bluesky", "linkedin", "threads"];

export function SettingsContent({
  socialAccounts: initialAccounts,
}: {
  socialAccounts: SocialAccountPublic[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [blueskyDialogOpen, setBlueskyDialogOpen] = useState(false);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
      router.replace("/settings");
    }
    if (error) {
      const messages: Record<string, string> = {
        linkedin_denied: "LinkedIn connection was denied.",
        linkedin_failed: "LinkedIn connection failed. Please try again.",
        linkedin_state_mismatch: "LinkedIn connection failed (security check). Please try again.",
        threads_denied: "Threads connection was denied.",
        threads_failed: "Threads connection failed. Please try again.",
        threads_state_mismatch: "Threads connection failed (security check). Please try again.",
      };
      toast.error(messages[error] || "Connection failed. Please try again.");
      router.replace("/settings");
    }
  }, [searchParams, router]);

  function getAccount(platform: SocialPlatform): SocialAccountPublic | null {
    return initialAccounts.find((a) => a.platform === platform) ?? null;
  }

  function handleConnect(platform: SocialPlatform) {
    if (platform === "bluesky") {
      setBlueskyDialogOpen(true);
    } else {
      window.location.href = `/api/social/${platform}/connect`;
    }
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="mt-1 text-muted-foreground">
          Manage your social accounts and preferences.
        </p>
      </div>

      <section>
        <h3 className="mb-4 text-lg font-semibold">Connected Accounts</h3>
        <div className="grid gap-4">
          {PLATFORMS.map((platform) => (
            <SocialAccountCard
              key={platform}
              platform={platform}
              account={getAccount(platform)}
              onConnect={() => handleConnect(platform)}
              onDisconnected={handleRefresh}
            />
          ))}
        </div>
      </section>

      <BlueskyConnectDialog
        open={blueskyDialogOpen}
        onOpenChange={setBlueskyDialogOpen}
        onConnected={handleRefresh}
      />
    </>
  );
}
